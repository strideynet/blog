---
title: "Go: stop using sql.Open!"
date: 2021-03-21 09:00:00
tags:
- Go
---

One of my biggest gripes in Go relates to the ``database/sql`` package. This roots from two concerns, which can be seen in the snippet below:

```go
import (
    "database/sql"
    "time"

    _ "github.com/go-sql-driver/mysql"
)

func connect() (*sql.DB, error){
    db, err := sql.Open("mysql", "user:password@mysqlhost/database?parseTime=true")
    if err != nil {
        return nil, err
    }

    return db, nil
}
```

## Global registration is scary

One of the first things in the file is the import statement, where we import the ``go-sql-driver/mysql`` package and mark it as unused with an underscore. This is because the package must be imported so that it's ``init()`` runs which registers it as a driver in the ``sql`` package so that we can use the name ``mysql`` in the ``sql.Open``.

Any global state in Go tends to scare me! It becomes very unclear to a consuming engineer how the components interact as this is entirely obscured from them, and it isn't immediately clear what the behaviour would be if two drivers tried to register with the same name (I'd assume a panic). Even worse, is the potential for unexpected behaviour to leak from one of your dependencies, as there is nothing stopping them from introducing drivers to the registry that you share with them.

Where possible, it makes much more sense to maintain control of the dependencies, rather than introducing this global registry. Fortunately, this has been recognised with the introduction of ``sql.OpenDB`` which lets you provide a ``driver.Connector`` directly, this can be seen in the example at the bottom.

## DSNs aren't great

The ``sql.Open`` method requires you provide some kind of string to the underlying driver, and this is usually a very lengthy DSN that includes everything from the authentication details to any parsing options. It seems to totally diverge from the realms of static type checking that make Go so great, making it far too easy to incorrectly format the string. This is somewhat solved by some libraries providing a config struct that can be converted to a DSN, but surely it would be far simpler to just allow that config type to be directly provided when creating the connection?

Not only is it more susceptible to developer mistakes, it can make it impossible to specify some configurations. For example, [it's not possible to specify a mysql username including a colon](https://github.com/go-sql-driver/mysql/issues/688).

This tends to shephard engineers down paths that cause them more issues. For example, putting the entire DSN into a single environment variable for configuration. This leads to an ops nightmare as pieces of information that are not secret (the port to connect to) and secret (the password) are joined together in a single piece of environment (the DSN) that has to be treated as a secret, when it would make much more sense for information like the host and database to remain plaintext for a happier engineering experience. In the worst case scenario, it leads to secrets not being protected out of laziness.

## The better way

I present to you, the better way: ``sql.OpenDB()``. This remains, in my opinion, the best way of using the ``database/sql`` package if your driver supports it. However, you should also take a deep think about if the package is even appropriate for your needs. If you are using postgres and aren't interesting in pretending that swapping out your database on a whim is a project requirement, then you should consider using ``jackc/pgx`` and omit ``database/sql`` entirely. This has so far served my needs much better (faster, more features) and I haven't needed the additional abstraction introduced by ``database/sql``

```go
import (
    "database/sql"
    "time"

    "github.com/go-sql-driver/mysql"
)

func connect() (*sql.DB, error){
    cfg := mysql.NewConfig()
    cfg.User = "user"
    cfg.Passwd = "password"
    cfg.Addr = "mysqlhost"
    cfg.DBName = "database"
    cfg.ParseTime = true

    connector, err := mysql.NewConnector(cfg)
    if err != nil {
        return nil, err
    }

    db, err := sql.OpenDB()
    if err != nil {
        return nil, err
    }

    return db, nil
}
```
