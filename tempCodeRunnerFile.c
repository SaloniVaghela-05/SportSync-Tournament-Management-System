#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <time.h>
#include <limits.h>

// --- Configuration and Constants ---

typedef struct {
    int seed;
    char addr[256];
    char addrDesc[256];
    double seekSpeed;
    double rotateSpeed;
    char policy[10];
    int window;
    int skew;
    char zoning[20];
    char lateAddr[256];
    char lateAddrDesc[256];
    int compute;
} Options;

Options options;

const int MAX_TRACKS = 1000;
const int TRACK_WIDTH = 40;
const int MAX_BLOCKS = 10000;

typedef enum {
    STATE_NULL = 0,
    STATE_SEEK = 1,
    STATE_ROTATE = 2,
    STATE_XFER = 3,
    STATE_DONE = 4
} State;

typedef struct {
    int first; // block
    int second; // index
} Request;

// --- Utility Functions ---

void random_seed(int seed) {
    srand(seed);
}

double random_float() {
    return (double)rand() / RAND_MAX;
}

char** split_string(const char* s, char delimiter, int* count) {
    char* str = strdup(s);
    char* token;
    char** tokens = NULL;
    int n = 0;
    token = strtok(str, &delimiter);
    while (token) {
        tokens = realloc(tokens, sizeof(char*) * (n + 1));
        tokens[n] = strdup(token);
        n++;
        token = strtok(NULL, &delimiter);
    }
    free(str);
    *count = n;
    return tokens;
}

void free_split(char** tokens, int count) {
    for (int i = 0; i < count; i++) {
        free(tokens[i]);
    }
    free(tokens);
}

// --- Disk Simulator Struct ---

typedef struct {
    char policy[10];
    double seekSpeedBase;
    double rotateSpeed;
    int skew;
    int window;
    int compute;
    char zoning[20];

    // Disk Geometry
    int tracks[3];
    
    // Block Layout
    int blockToTrack[MAX_BLOCKS]; 
    double blockToAngle[MAX_BLOCKS]; 
    struct { int begin, end; } tracksBeginEnd[3];
    int blockAngleOffset[3];
    int maxBlock;

    // Requests and Scheduling
    Request* requestQueue; 
    int requestQueueSize;
    State* requestState;
    char** initialLateRequests;
    int initialLateRequestsSize;
    int lateCount;
    int requestCount;

    int armTrack;
    int currentIndex;
    int currentBlock;
    State state;
    double angle; 

    // Timing and Stats
    double timer;
    double seekTotal;
    double rotTotal;
    double xferTotal;
    double seekBegin;
    double rotBegin;
    double xferBegin;

    // Scheduling Window
    int fairWindow;
    int currWindow;
} Disk;

void PrintAddrDescMessage(const char* value) {
    fprintf(stderr, "Bad address description (%s)\n", value);
    fprintf(stderr, "The address description must be a comma-separated list of length three, without spaces.\n");
    exit(1);
}

void InitBlockLayout(Disk* d) {
    d->tracks[0] = 140;
    d->tracks[1] = d->tracks[0] - TRACK_WIDTH;
    d->tracks[2] = d->tracks[1] - TRACK_WIDTH;

    if (d->seekSpeedBase > 1 && fmod(TRACK_WIDTH, d->seekSpeedBase) != 0.0) {
        fprintf(stderr, "Seek speed (%.1f) must divide evenly into track width (%d)\n", d->seekSpeedBase, TRACK_WIDTH);
        exit(1);
    }

    int zoning_count;
    char** zones = split_string(d->zoning, ',', &zoning_count);
    if (zoning_count != 3) {
        fprintf(stderr, "Zoning must have 3 comma-separated values.\n");
        exit(1);
    }

    for (int i = 0; i < 3; i++) {
        d->blockAngleOffset[i] = atoi(zones[i]) / 2;
    }
    free_split(zones, zoning_count);

    int pblock = 0;
    int numTracks = 3;

    for (int track = 0; track < numTracks; ++track) {
        int currentSkew = (track == 0) ? d->skew : (track == 1) ? d->skew : 2 * d->skew;
        int angleOffset = 2 * d->blockAngleOffset[track];

        for (int angle = 0; angle < 360; angle += angleOffset) {
            int block = (angle / angleOffset) + pblock;
            
            d->blockToTrack[block] = track;
            
            double blockAngle = (double)angle;
            if (track > 0) {
                blockAngle += (angleOffset * currentSkew);
            }

            d->blockToAngle[block] = fmod(blockAngle, 360.0);
        }
        d->tracksBeginEnd[track].begin = pblock;
        d->tracksBeginEnd[track].end = pblock + (360 / angleOffset) - 1;
        pblock += (360 / angleOffset);
    }

    d->maxBlock = pblock;

    for (int i = 0; i < d->maxBlock; i++) {
        d->blockToAngle[i] = fmod((d->blockToAngle[i] + 180.0), 360.0);
    }
}

char** MakeRequests(const char* addr_in, const char* addrDesc_in, int* count) {
    if (strcmp(addr_in, "-1") != 0) {
        return split_string(addr_in, ',', count);
    }
    
    int desc_count;
    char** desc = split_string(addrDesc_in, ',', &desc_count);
    if (desc_count != 3) {
        PrintAddrDescMessage(addrDesc_in);
    }
    int numRequests = atoi(desc[0]);
    int maxRequest = atoi(desc[1]);
    int minRequest = atoi(desc[2]);
    
    if (maxRequest == -1) {
        maxRequest = MAX_BLOCKS; // or d->maxBlock, but d not available
    }
    
    char** tmpList = malloc(sizeof(char*) * numRequests);
    *count = numRequests;
    for (int i = 0; i < numRequests; ++i) {
        int block = (int)(random_float() * (maxRequest - minRequest)) + minRequest;
        tmpList[i] = malloc(16);
        sprintf(tmpList[i], "%d", block);
    }
    free_split(desc, desc_count);
    return tmpList;
}

void AddQueueEntry(Disk* d, int block, int index) {
    d->requestQueue = realloc(d->requestQueue, sizeof(Request) * (d->requestQueueSize + 1));
    d->requestQueue[d->requestQueueSize].first = block;
    d->requestQueue[d->requestQueueSize].second = index;
    d->requestState = realloc(d->requestState, sizeof(State) * (d->requestQueueSize + 1));
    d->requestState[d->requestQueueSize] = STATE_NULL;
    d->requestQueueSize++;
}

void SwitchState(Disk* d, State newState) {
    d->state = newState;
    if (d->currentIndex != -1 && d->currentIndex < d->requestQueueSize) {
        d->requestState[d->currentIndex] = newState;
    }
}

int RadiallyCloseTo(double a1, double a2, double rotateSpeed) {
    double v = fabs(a1 - a2);
    if (v > 180.0) { 
        v = 360.0 - v;
    }
    return v < rotateSpeed;
}

int DoneWithTransfer(Disk* d) {
    if (d->currentBlock == -1) return 0;
    int track = d->blockToTrack[d->currentBlock];
    int angleOffset = d->blockAngleOffset[track];
    double targetAngle = fmod((d->blockToAngle[d->currentBlock] + angleOffset), 360.0);
    
    if (RadiallyCloseTo(d->angle, targetAngle, d->rotateSpeed)) {
        SwitchState(d, STATE_DONE);
        d->requestCount++;
        return 1;
    }
    return 0;
}

int DoneWithRotation(Disk* d) {
    if (d->currentBlock == -1) return 0;
    int track = d->blockToTrack[d->currentBlock];
    int angleOffset = d->blockAngleOffset[track];
    double targetAngle = fmod((d->blockToAngle[d->currentBlock] - angleOffset + 360.0), 360.0);
    
    if (RadiallyCloseTo(d->angle, targetAngle, d->rotateSpeed)) {
        SwitchState(d, STATE_XFER);
        return 1;
    }
    return 0;
}

void PlanSeek(Disk* d, int track) {
    d->seekBegin = d->timer;
    SwitchState(d, STATE_SEEK); 

    if (track == d->armTrack) {
        d->rotBegin = d->timer;
        SwitchState(d, STATE_ROTATE); 
        return;
    }
}

int DoneWithSeek(Disk* d) {
    if (d->currentBlock == -1) return 0;
    int targetTrack = d->blockToTrack[d->currentBlock];
    int dist = abs(d->armTrack - targetTrack);
    double seekTimeNeeded = (TRACK_WIDTH / d->seekSpeedBase) * dist;

    if (d->timer >= d->seekBegin + seekTimeNeeded) {
        d->armTrack = targetTrack;
        return 1;
    }
    return 0;
}

Request DoSATF(Disk* d, Request* rList, int rListSize) {
    int minBlock = -1;
    int minIndex = -1;
    double minEst = -1.0;

    for (int i = 0; i < rListSize; i++) {
        int block = rList[i].first;
        int index = rList[i].second;

        if (d->requestState[index] == STATE_DONE) continue;

        int track = d->blockToTrack[block];
        double angle = d->blockToAngle[block];

        int dist = abs(d->armTrack - track);
        double seekEst = (TRACK_WIDTH / d->seekSpeedBase) * dist;

        int angleOffset = d->blockAngleOffset[track];
        double angleAtArrival = fmod((d->angle + (seekEst * d->rotateSpeed)), 360.0);
        
        double targetAngle = fmod((angle - angleOffset + 360.0), 360.0);
        
        double rotDist = targetAngle - angleAtArrival;
        while (rotDist > 360.0) rotDist -= 360.0;
        while (rotDist < 0.0) rotDist += 360.0;
        
        double rotEst = rotDist / d->rotateSpeed;

        double xferEst = (angleOffset * 2.0) / d->rotateSpeed; 

        double totalEst = seekEst + rotEst + xferEst;

        if (minEst < 0 || totalEst < minEst) {
            minEst = totalEst;
            minBlock = block;
            minIndex = index;
        }
    }
    
    Request res = {minBlock, minIndex};
    return res;
}

Request* DoSSTF(Disk* d, Request* rList, int rListSize, int* outSize) {
    int minDist = MAX_TRACKS;
    Request* trackList = NULL;
    int trackListSize = 0;

    for (int i = 0; i < rListSize; i++) {
        int block = rList[i].first;
        int index = rList[i].second;

        if (d->requestState[index] == STATE_DONE) continue;

        int track = d->blockToTrack[block];
        int dist = abs(d->armTrack - track);
        
        if (dist < minDist) {
            free(trackList);
            trackList = malloc(sizeof(Request));
            trackList[0] = rList[i];
            trackListSize = 1;
            minDist = dist;
        } else if (dist == minDist) {
            trackList = realloc(trackList, sizeof(Request) * (trackListSize + 1));
            trackList[trackListSize] = rList[i];
            trackListSize++;
        }
    }
    *outSize = trackListSize;
    return trackList;
}

void UpdateWindow(Disk* d) {
    if (d->fairWindow != -1 && d->requestCount > 0 && (d->requestCount % d->fairWindow == 0)) {
        d->currWindow += d->fairWindow;
    }
}

int GetWindow(Disk* d) {
    if (d->window == -1) {
        return d->requestQueueSize;
    } else {
        return d->currWindow;
    }
}

void DoRequestStats(Disk* d) {
    double seekTime = d->rotBegin - d->seekBegin;
    double rotTime = d->xferBegin - d->rotBegin;
    double xferTime = d->timer - d->xferBegin;
    double totalTime = d->timer - d->seekBegin;

    if (d->compute) {
        printf("Block: %3d  Seek:%3d  Rotate:%3d  Transfer:%3d  Total:%4d\n",
               d->currentBlock, (int)round(seekTime), (int)round(rotTime), (int)round(xferTime), (int)round(totalTime));
    }

    d->seekTotal += seekTime;
    d->rotTotal += rotTime;
    d->xferTotal += xferTime;
}

void Animate(Disk* d) {
    d->timer += 1.0; 

    d->angle = fmod((d->angle + d->rotateSpeed), 360.0);

    if (d->state == STATE_SEEK) {
        if (DoneWithSeek(d)) {
            d->rotBegin = d->timer;
            SwitchState(d, STATE_ROTATE);
        }
    } else if (d->state == STATE_ROTATE) {
        if (DoneWithRotation(d)) {
            d->xferBegin = d->timer;
            SwitchState(d, STATE_XFER);
        }
    } else if (d->state == STATE_XFER) {
        if (DoneWithTransfer(d)) {
            DoRequestStats(d);
            SwitchState(d, STATE_DONE);
            UpdateWindow(d);
            
            int currentBlock_copy = d->currentBlock;
            GetNextIO(d);
            int nextBlock = d->currentBlock;
            int armTrack_copy = d->armTrack; 

            if (d->blockToTrack[currentBlock_copy] == d->blockToTrack[nextBlock]) {
                int isSequential = 0;
                int lastBlockOnTrack = d->tracksBeginEnd[armTrack_copy].end;
                int firstBlockOnTrack = d->tracksBeginEnd[armTrack_copy].begin;
                
                if ((currentBlock_copy == lastBlockOnTrack && nextBlock == firstBlockOnTrack) || (currentBlock_copy + 1 == nextBlock)) {
                    isSequential = 1;
                }

                if (isSequential) {
                    d->rotBegin = d->timer; 
                    d->seekBegin = d->timer;
                    d->xferBegin = d->timer; 
                    SwitchState(d, STATE_XFER);
                }
            }
        }
    }
}

void GetNextIO(Disk* d) {
    if (d->requestCount == d->requestQueueSize) {
        return;
    }

    Request* currentList = malloc(sizeof(Request) * d->requestQueueSize);
    int endIndex = GetWindow(d);
    if (endIndex > d->requestQueueSize) {
        endIndex = d->requestQueueSize;
    }

    int currentListSize = 0;
    for (int i = 0; i < endIndex; ++i) {
         currentList[currentListSize++] = d->requestQueue[i];
    }
    
    Request nextRequest = {-1, -1};
    
    if (strcmp(d->policy, "FIFO") == 0) {
        for (int i = 0; i < d->requestQueueSize; i++) {
            if (d->requestState[d->requestQueue[i].second] != STATE_DONE) {
                nextRequest = d->requestQueue[i];
                break;
            }
        }
        if (nextRequest.first != -1) {
            Request temp[1] = {nextRequest};
            nextRequest = DoSATF(d, temp, 1);
        }

    } else if (strcmp(d->policy, "SATF") == 0 || strcmp(d->policy, "BSATF") == 0) {
        nextRequest = DoSATF(d, currentList, currentListSize);

    } else if (strcmp(d->policy, "SSTF") == 0) {
        int trackListSize;
        Request* trackList = DoSSTF(d, currentList, currentListSize, &trackListSize);
        if (trackListSize > 0) {
             nextRequest = DoSATF(d, trackList, trackListSize);
        }
        free(trackList);
    } else {
        fprintf(stderr, "Policy (%s) not implemented\n", d->policy);
        exit(1);
    }

    free(currentList);

    if (nextRequest.first == -1) {
        return;
    }

    d->currentBlock = nextRequest.first;
    d->currentIndex = nextRequest.second;

    PlanSeek(d, d->blockToTrack[d->currentBlock]);
    
    if (d->lateCount < d->initialLateRequestsSize) {
        AddQueueEntry(d, atoi(d->initialLateRequests[d->lateCount]), d->requestQueueSize);
        d->lateCount++;
    }
}

void Go(Disk* d) {
    if (!d->compute) {
        return;
    }
    
    GetNextIO(d);
    while (d->requestCount < d->requestQueueSize) {
        Animate(d);
    }
    PrintStats(d);
}

void PrintStats(Disk* d) {
    if (d->compute) {
        printf("\nTOTALS\n  Seek:%3d  Rotate:%3d  Transfer:%3d  Total:%4d\n\n",
               (int)round(d->seekTotal), (int)round(d->rotTotal), (int)round(d->xferTotal), (int)round(d->timer));
    }
}

Disk* Disk_create(const char* a, const char* aD, const char* lA, const char* lAD, const char* p, double sS, double rS, int w, int sk, const char* z, int c) {
    Disk* d = malloc(sizeof(Disk));
    strcpy(d->policy, p);
    d->seekSpeedBase = sS;
    d->rotateSpeed = rS;
    d->skew = sk;
    d->window = w;
    d->compute = c;
    strcpy(d->zoning, z);

    d->requestQueue = NULL;
    d->requestQueueSize = 0;
    d->requestState = NULL;
    d->initialLateRequests = NULL;
    d->initialLateRequestsSize = 0;
    d->lateCount = 0;
    d->requestCount = 0;

    d->armTrack = 0;
    d->currentIndex = -1;
    d->currentBlock = -1;
    d->state = STATE_NULL;
    d->angle = 0.0;

    d->timer = 0.0;
    d->seekTotal = 0.0;
    d->rotTotal = 0.0;
    d->xferTotal = 0.0;

    d->fairWindow = (w == -1) ? -1 : w;
    d->currWindow = (w == -1) ? -1 : w;

    InitBlockLayout(d);

    int reqCount;
    char** requests = MakeRequests(a, aD, &reqCount);
    for (int i = 0; i < reqCount; ++i) {
        AddQueueEntry(d, atoi(requests[i]), i);
        free(requests[i]);
    }
    free(requests);

    d->initialLateRequests = MakeRequests(lA, lAD, &d->initialLateRequestsSize);

    return d;
}
void Disk_destroy(Disk* d) {
    free(d->requestQueue);
    free(d->requestState);
    free_split(d->initialLateRequests, d->initialLateRequestsSize);
    free(d);
}
// --- Example Usage ---
int main() {
    // Example configuration
    const char* addr = "-1";
    const char* addrDesc = "10,1000,0"; // 10 requests between block 0 and 1000
    const char* lateAddr = "-1";
    const char* lateAddrDesc = "5,1000,0"; // 5 late requests between block 0 and 1000
    const char* policy = "SATF";
    double seekSpeed = 10.0; // blocks per ms
    double rotateSpeed = 0.1; // degrees per ms
    int window = -1; // no windowing
    int skew = 2; // blocks
    const char* zoning = "8,16,32"; // zoning configuration
    int compute = 1; // enable computation

    random_seed(42); // Seed for reproducibility

    Disk* disk = Disk_create(addr, addrDesc, lateAddr, lateAddrDesc, policy, seekSpeed, rotateSpeed, window, skew, zoning, compute);
    
    Go(disk);
    
    Disk_destroy(disk);
    
    return 0;
}

