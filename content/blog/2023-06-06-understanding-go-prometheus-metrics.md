---
title: "Understanding Go Prometheus metrics"
date: 2023-06-06 09:00:00
tags:
- Go
- Observability
---

> 🚨 This post is work in progress.

> 🚨 This was last updated for Go 1.20.3. Details may have changed.

By default, adding Prometheus instrumentation to a Go service exports a bunch of useful metrics about the performance of your service. But, for someone unfamiliar with these, it can be difficult to interpret them and know which ones are important! For my own record, and in the hopes this helps someone else, I've broken these down here.

## Some things to know

Some terminology I might use:

- Gauge: This is a type of metric that shows a current value, it can go up or down (unlike a counter). An example of this might be the amount of memory currently being used by a Go application.
- Counter: This is a type of a metric that counts a number of things. It's often described as "monotonically increasing".

## The metrics

### go_goroutines

```sh
# HELP go_goroutines Number of goroutines that currently exist  
# TYPE go_goroutines gauge  
go_goroutines 41
```

The help message for this metric is pretty self explanatory - it shows the current number of Goroutines that exist in your service.

This metric is really useful for detecting Goroutine leaks. A Goroutine leak is when Goroutines are created but are not then destroyed when appropriate. Each Goroutine uses an amount of memory, so this is effectively also a memory leak. If this metric increases, and does not decrease or stabilise, you likely have a Goroutine leak.

### process_open_fds

```sh
# HELP process_open_fds Number of open file descriptors.
# TYPE process_open_fds gauge
process_open_fds 13
```

Again, the help message for this metric is pretty self explanatory - it shows the current number of open file descriptors.

This is useful for detecting cases where file descriptor leaks in your service. These generally occur when files are opened, but then not closed. For example:

**Bad**

```go
func doThing() error {
    f, err := os.Open("/my/path")
    if err != nil {
        return err
    }

    // Do some things with the file
    return nil
}
```

**Good**

```go
func doThing() error {
    f, err := os.Open("/my/path")
    if err != nil {
        return err
    }
    defer f.Close() // Note the inclusion of this line!

    // Do some things with the file
    return nil
}
```

This is problematic because the number of file descriptors that can be opened is finite on many systems. If this value exhausts the limit then it can not only cause problems for your service, but also for other processes running on the system. If this metric increases, and does not decrease or stabilise, you likely have a file descriptor leak.

### process_max_fds

```sh
# HELP process_max_fds Maximum number of open file descriptors.
# TYPE process_max_fds gauge
process_max_fds 1.048576e+06
```

This metric indicates the maximum number of open file descriptors your service is allowed to open. In combination with the `process_open_fds`, you can calculate a percentage of the limit that is in use. By itself, this isn't that useful.

### process_resident_memory_bytes

```sh
# HELP process_resident_memory_bytes Resident memory size in bytes.
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 8.2771968e+07
```

### process_virtual_memory_bytes

```sh
# HELP process_virtual_memory_bytes Virtual memory size in bytes.
# TYPE process_virtual_memory_bytes gauge
process_virtual_memory_bytes 1.331462144e+09
```
