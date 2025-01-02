---
draft: true
author: aergonaut
pubDatetime: 2021-02-07
title: "Jest Module Mocking for Fun and Profit"
description: An adventure in mocking module exports with Jest
postSlug: jest-module-mocking
featured: false
tags:
  - jest
  - testing
  - javascript
---

Recently at work, I was writing tests for a React component for a new feature I was working on. Part of the new functionality was displaying error messages using an in-house toast notification framework. The toast API looks broadly like this:

```jsx
import ( toast ) from "@lib/components";

const Page = () =>{
  if (error) {
    toast.negative({
      title: "Error",
      message: error.message;
    });
  }

  // continue rendering...
}
```

I wanted to test that the component correctly calls `toast.negative` when an error occurs. One way to do this is to use mocks. Let's see how to do this with Jest!

## Mocking with Jest

In the realm of unit testing, a mock is an object created to simulate the behavior of another object that the system under test depends on.
