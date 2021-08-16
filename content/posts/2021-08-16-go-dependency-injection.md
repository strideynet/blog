---
title: "Injecting dependencies for better Go"
date: 2021-08-16 09:00:00
tags:
- Go
---


Perhaps the biggest habit I see from other languages (primarily JavaScript, Ruby and Python) is an attraction to a little bit of magic when it comes to construction of dependencies. Engineers tend to try and hide away the complexity of the initialisation of their application by putting bits such as connecting to a database within components of their application, rather than doing this within the main function. Here's an example of that:

```go
package main

import (
    "flag"
    "log"
    "demo/repo"
)

func main() {
    var databaseDSN string
    {
        flag.StringVar(&databaseDSN, "dsn", "", "dsn for connection to database")
        flag.Parse()
    }

    r, err := repo.New(databaseDSN)
    if err != nil {
        log.Fatalf("failed to setup repo: %s", err)
    }

    // ... some code setting up the rest of your app, e.g a http listener etc
}

---

package repo

import (
    "database/sql"
    "github.com/go-sql-driver/mysql"
)

type repository struct {
    db *sql.DB
}

func New(dsn string) (*repository, error) {
    config, err := mysql.ParseDSN(dsn)
    if err != nil {
        return nil, err
    }

    connector, err := mysql.NewConnector(config)
    if err != nil {
        return nil, err
    }

    db := sql.OpenDB(connector)
    // TODO: hmm, we need to close this somewhere!

    return &repository{
        db: db,
    }, nil
}
```

Whilst the example is quite simplistic, it does demonstrate whats wrong with this approach. Here we have a Repository (a type used to wrap access data to the Database), which is needed by some other part of the application (for example, the HTTP endpoint handlers). The Repository somehow needs to be provided with a database connection to use for its queries and the author has decided to put the setup for that connection in `repo.New(dsn string)`. What's wrong with that?

First of all, it's hard to manage the closure of application lifetime resources. The database connection should be closed properly, but there's nowhere for us to do that sensibly inside of the `repo.New()` function. We could add a .`Close()` method to the repository, and call that within the `main()`. However, it might not be immediately clear that this needs doing. Engineers expect to need to close connections, and if your type isn't named in a way that suggests it, it'll be easy to omit.

Secondly, it's now much harder to re-use this code elsewhere or in a more flexible way. The repository is based around `sql.DB`and could theoretically back onto any type of SQL database, but the constructor forces our hand to using MySQL. If we were producing a "lite" version of our application that ran as a CLI tool, we might want it to use a local sqlite database, and to support that we'd need to create a different `repo.New()` or add another parameter for controlling this behaviour. Testing also becomes more complex. In all likelihood, we probably want to exchange that real database connection for a mock when testing, and we wouldn't be able to make use of the `New()` method in the tests, instead having to manually create an instance of the struct.

And finally, and in my opinion most importantly, you begin to obscure the dependencies of your application. I've seen many who feel naturally opposed to the verbose way that Dependency Injection is typically handled in Go, but I try to see the benefits of this verbosity. By following best practices here, you can take a quick glance at the `main()` of an application and know how complex it is. If it's long, and there's a lot of dependencies, then its a sign that your application is complicated. There's nothing to be ashamed of there, and there's no need to tie ourselves up trying to hide this complexity.

Here's what it would look like my way, with the database connection being injected in to the Repository:

```go
package main

import (
    "flag"
    "log"
    "demo/repo"
)

func main() {
    var databaseDSN string
    {
        flag.StringVar(&databaseDSN, "dsn", "", "dsn for connection to database")
        flag.Parse()
    }
    
    var db *sql.DB
    {
        config, err := mysql.ParseDSN(databaseDSN)
        if err != nil {
            log.Fatalf("failed to parse dsn: %s", err)
        }

        connector, err := mysql.NewConnector(config)
        if err != nil {
            log.Fatalf("failed to create connector: %s", err)
        }

        db = sql.OpenDB(connector)
        defer db.Close()
    }

    r := repo.New(db)

    // ... some code setting up the rest of your app, e.g a http listener etc
}

---

package repo

import (
    "database/sql"
    "github.com/go-sql-driver/mysql"
)

type repository struct {
    db *sql.DB
}

func New(db *sql.DB) *repository {
    return &repository{
        db: db,
    }
}
```

With this new layout, we have the following advantages:

- It's far easier for us to now insert a different *sql.DB into our repository (e.g a sqlite connection).
- We can now see all of our application dependencies in main().
- The Repository is now responsible for a single thing (making queries to the DB) and doesn't have the additional responsibility of understanding the application config.
- We can now easily defer the closing of the connection to the database when the application ends.
