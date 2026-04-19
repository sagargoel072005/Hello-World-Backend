#include <stdio.h>

struct Process {
    int id;
    int arrival_time;
    int burst_time;
    int waiting_time;
    int turnaround_time;
    int completed;
};

int findNextProcess(struct Process p[], int n, int current_time) {
    int idx = -1;
    int min_burst = 1e9;

    for (int i = 0; i < n; i++) {
        if (!p[i].completed && p[i].arrival_time <= current_time) {
            if (p[i].burst_time < min_burst) {
                min_burst = p[i].burst_time;
                idx = i;
            } else if (p[i].burst_time == min_burst) {
                if (p[i].arrival_time < p[idx].arrival_time)
                    idx = i;
            }
        }
    }

    return idx;
}

void sjfScheduling(struct Process p[], int n) {
    int completed = 0, current_time = 0;
    while (completed < n) {
        int idx = findNextProcess(p, n, current_time);
        if (idx == -1) {
            current_time++; // No process available, idle time
        } else {
            p[idx].waiting_time = current_time - p[idx].arrival_time;
            current_time += p[idx].burst_time;
            p[idx].turnaround_time = p[idx].waiting_time + p[idx].burst_time;
            p[idx].completed = 1;
            completed++;
        }
    }
}

void printTable(struct Process p[], int n) {
    printf("\nPID\tAT\tBT\tWT\tTAT\n");
    for (int i = 0; i < n; i++) {
        printf("%d\t%d\t%d\t%d\t%d\n", p[i].id, p[i].arrival_time, p[i].burst_time, p[i].waiting_time, p[i].turnaround_time);
    }
}

void printAvg(struct Process p[], int n) {
    float total_wt = 0, total_tat = 0;
    for (int i = 0; i < n; i++) {
        total_wt += p[i].waiting_time;
        total_tat += p[i].turnaround_time;
    }

    printf("\nAverage Waiting Time: %.2f", total_wt / n);
    printf("\nAverage Turnaround Time: %.2f\n", total_tat / n);
}

int main() {
    int n;

    printf("Enter number of processes: ");
    scanf("%d", &n);

    struct Process p[n];

    for (int i = 0; i < n; i++) {
        p[i].id = i + 1;
        printf("Enter arrival time for process %d: ", i + 1);
        scanf("%d", &p[i].arrival_time);
        printf("Enter burst time for process %d: ", i + 1);
        scanf("%d", &p[i].burst_time);
        p[i].completed = 0;
    }

    sjfScheduling(p, n);
    printTable(p, n);
    printAvg(p, n);

    return 0;
}
