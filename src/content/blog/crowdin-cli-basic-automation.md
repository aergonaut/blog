---
draft: true
author: aergonaut
pubDatetime: 2024-10-14
title: "Basic Automation with Crowdin CLI"
description: Getting started with continuous localization
postSlug: crowdin-cli-basic-automation
featured: false
tags:
  - localization
  - automation
---

If you have a website or app, and you're interested in providing translations in different languages, then you might want to consider using [Crowdin](https://crowdin.com/) to manage your project's localization process. Crowdin provides a platform that mekes it easy to get started with localization, and provides tools to help you streamline the process. In this post, I'll walk through how to set up a basic automation workflow using Crowdin's CLI to get automated translation of your app's text, immediately after you make changes in your source code.

## 1. Sign up for a Crowdin account

Sign up for an account on [Crowdin](https://crowdin.com/), or use your existing account if you have one.

## 2. Create a new project on Crowdin

Create a new project on Crowdin to manage your app's translations. Take note of the project ID that is generated for you, as we'll need it later.

## 3. Create a personal access token

Create a [personal access token](https://crowdin.com/settings#api-key) for your Crowdin account. This token will be used to authenticate with the Crowdin API. Be sure to copy it down, as you won't be able to view it again after you first create it.

## 4. Install the Crowdin CLI tool on your machine

Install the [Crowdin CLI](https://crowdin.github.io/crowdin-cli/installation) tool, following the instructions for your operating system.

## 5. Create a config file in your project's root directory

Crowdin depends on a config file in your project's root directory named `crowdin.yml`. Create this file and open it up for editing.

Start by adding the project ID that you generated earlier to the `project_id` field. We'll also set the `preserve_hierarchy` option to `true`, which will ensure that Crowdin preserves the file structure of your project's source files.

```yaml
project_id: 1234567890
preserve_hierarchy: true
```

## 6. Configure source and destination patterns for your translation files

This will vary depending on the structure of your project, what framework you use, and how you want to organize your translations. For a Rails application, a configuration like the following is a good place to start:

```yaml
files:
  - source: config/locales/en.yml
    translation: config/locales/%two_letters_code%.%file_extension%
```
