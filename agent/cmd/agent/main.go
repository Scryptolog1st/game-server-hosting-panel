package main

import (
    "fmt"
    "time"
)

func main() {
    fmt.Println("GameServer Agent starting... (dev stub)")
    // TODO: Load config, establish mTLS to Panel, heartbeat loop.
    for i := 0; i < 3; i++ {
        fmt.Println("heartbeat")
        time.Sleep(2 * time.Second)
    }
    fmt.Println("Agent stub exit.")
}
