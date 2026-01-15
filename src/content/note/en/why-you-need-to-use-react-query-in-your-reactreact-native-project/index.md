---
title: Why you need to use React-Query in your React/React Native project
timestamp: 2021-06-28 20:21:16+01:00
tags: [React,React Native,ReactQuery,State Management]
toc: true
---

## Introduction

Have you had issues with managing server state? or find yourself writing long and funny looking code that just fetches data from the server? I honestly think you need to look at react-query if you fall into any of this category.

Server state is state that's actually stored on the server then is temporarily store in the client for quick-access (like user data, transaction data)

React's lack of standard data-fetching paradigm has led to the creation of several state management libraries. However, these libraries do not fully support handling async data(server state) properly. Async data is typically handled at the component level where each state associated to it is usually tracked i.e loading, error, data, refreshing e.t.c. as the number of server states tracked increases, the difficulty in managing server state increases.

React Query is a library that effectively  helps manage and keep track of server state. In this article, I would be highlighting how to use react-query and why you should use it in your next application

> React Query is often described as the missing data-fetching library for React, but in more technical terms, it makes fetching, caching, synchronising and updating server state in your React applications a breeze.

## Prerequisites

You need basic knowledge of the technologies listed below

- React
- React hooks(elementary)
- State Management libraries (elementary)

## Why use React Query?

In a simple network request/call, the three server states that are of utmost importance are the loading, error and data server states. Using state management libraries to store these is not entirely efficient as the whole application doesn't need to know about these states as it is only relevant in the components that needs it.

A typical app global state looks like this 

```jsx
const globalState = {
    user: {},
    appSettings: {
      appVersion: "",
      theme: "light", // yes I am a thug
    },
    transactions: {
      data: [],
      transactionLoading: true,
			transactionError: null,
    }
  };
```

One question I ask myself before adding a state to a Global state management library is "Does the app need to know about this data?" and typically, almost all server states don't pass this test. My app doesn't need to know when the transaction is loading or giving an error, because this state is most likely used in one component. As these server states aren't needed globally, the next best decision is to create hooks to help manage basic server states. Although, this doesn't remove the difficulty in handling multiple server states like caching, refreshing, retrying, etc. React Query provides a consistent and straightforward way of managing server state as all of this have been abstracted into the library.

Talk is cheap, Let's get dirty!

### Installation

```bash
npm i react-query
# or
yarn add react-query
```

### Specimen One

```jsx
// https://codesandbox.io/s/reverent-sunset-rxwgl?file=/src/App.js
import { useEffect, useState } from "react";
import "./styles.css";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const [error, setError] = useState(null);
  useEffect(() => {
    async function getRepos() {
      try {
        const repoData = await fetch(
          "https://api.github.com/repos/tannerlinsley/react-query"
        ).then((res) => res.json());
        setData(repoData);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }
    getRepos();
  }, []);
  if (loading) return "Loading...";

  if (error) return "An error has occurred: " + error.message;
  return (
    <div className="App">
      <h1>Traditional way of handling server State</h1>
      <div>
        <h1>{data.name}</h1>
        <p>{data.description}</p>
        <strong>👀 {data.subscribers_count}</strong>{" "}
        <strong>✨ {data.stargazers_count}</strong>{" "}
        <strong>🍴 {data.forks_count}</strong>
      </div>
    </div>
  );
}
```

```jsx
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
 
 const queryClient = new QueryClient()
 
 export default function App() {
   return (
     <QueryClientProvider client={queryClient}>
       <Example />
     </QueryClientProvider>
   )
 }
 
 function Example() {
   const { isLoading, error, data } = useQuery('repoData', () =>
     fetch('https://api.github.com/repos/tannerlinsley/react-query').then(res =>
       res.json()
     )
   )
 
   if (isLoading) return 'Loading...'
 
   if (error) return 'An error has occurred: ' + error.message
 
   return (
     <div>
       <h1>{data.name}</h1>
       <p>{data.description}</p>
       <strong>👀 {data.subscribers_count}</strong>{' '}
       <strong>✨ {data.stargazers_count}</strong>{' '}
       <strong>🍴 {data.forks_count}</strong>
     </div>
   )
 }
```

Comparing the functions shows how the useQuery hook eliminates setting three different state, using a useEffect, catch errors and finally setting loading to false, handling all of this can be quite cumbersome and the **ethos** of react-query begins to manifest when multiple state are managed like an infinite list or paginated server state, refetching the query.

### Specimen Two

Let's take a look at the [Rick and Morty](https://react-query.tanstack.com/examples/rick-morty) example in the docs, as I think this is a more concise example to highlight how much complexity react-query removes from your application.

In [Examples.js](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/rick-morty?file=/src/Episodes.js:362-368)

```jsx
// https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/rick-morty?file=/src/Episodes.js:0-903
import React from "react";
import { Typography, Link } from "@material-ui/core";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "react-query";
import fetch from "./fetch";

export default function Episodes() {
  const { data, status } = useQuery("episodes", () =>
    fetch("https://rickandmortyapi.com/api/episode")
  );

  if (status === "loading") {
    return <p>Loading...</p>;
  }
  if (status === "error") {
    return <p>Error :(</p>;
  }

  return (
    <div>
      <Typography variant="h2">Episodes</Typography>
      {data.results.map(episode => (
        <article key={episode.id}>
          <Link component={RouterLink} to={`/episodes/${episode.id}`}>
            <Typography variant="h6">
              {episode.episode} - {episode.name} <em>{episode.airDate}</em>
            </Typography>
          </Link>
        </article>
      ))}
    </div>
  );
}
```

The episodes data is fetched and rendering is conditionally based on status (the loading server state, isn't used here as there are some flaws with using loading as a server state, you can check out Kent Dodds article here [https://kentcdodds.com/blog/stop-using-isloading-booleans](https://kentcdodds.com/blog/stop-using-isloading-booleans)).

```jsx
const { data, status } = useQuery("episodes", () =>
    fetch("https://rickandmortyapi.com/api/episode")
);
```

The "episodes" string is called the [Query Keys](https://react-query.tanstack.com/guides/query-keys) that helps keep track and manage the data's cache. The query key should be unique to the query data. If you leave the page then return, the data will be fetched immediately from the cache (please note that the data doesn't persist when the application closes) and will be re-fetched in the background, these are one of the [defaults](https://react-query.tanstack.com/guides/important-defaults) in react-query and is worth taking a look as it might bite you if as a Beginner.

Most of the other data fetching request in this example will follow this flow, where we try to fetch data from a server, if it is in the cache we get the data then it fetches the data in the background if not it fetch the data in the foreground, all of this pristine server state handling and the methods it exposes are the things that make react-query the right tool to use for server state.

## Summary

So here are reasons you need to use react-query in your React/React Native project are

- You don't write long exhaustive code that helps manage server state, react-query intuitively helps you write cleaner and shorter code as all of that management is abstracted into react-query.
- The application is almost always updated with the most recent server state.
- You don't have to deal with useEffects.

## Credits

[React Query Docs](https://react-query.tanstack.com)
[https://kentcdodds.com/blog/stop-using-isloading-booleans](https://kentcdodds.com/blog/stop-using-isloading-booleans)
[https://kentcdodds.com/blog/application-state-management-with-react#server-cache-vs-ui-state](https://kentcdodds.com/blog/application-state-management-with-react#server-cache-vs-ui-state)

Thanks to [Dominik](https://twitter.com/tkdodo?s=21), [Arafah](https://twitter.com/bamiogunfemi?s=21), and [Lulu](https://twitter.com/lulunwenyi?s=21) for reviewing.

Photo by Anni Roenkae from Pexels