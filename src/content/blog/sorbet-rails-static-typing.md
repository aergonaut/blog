---
author: aergonaut
pubDatetime: 2021-02-07
title: "Static Typing Ruby: Adopting Sorbet in a Rails Application"
description: Adopting static typing in an existing Rails application with Sorbet
postSlug: sorbet-tapioca-rails
featured: false
tags:
  - sorbet
  - rails
  - ruby
---

_This post was adapted from an internal newsletter originally published at Coupa. Some private information was removed, but the main content of the post remains the same._

---

I have long had a fascination with programming languages with strong type systems. Haskell, through [Learn You a Haskell][], was my first exposure to what a strong type system could really do; from there, I found Rust, Scala, and TypeScript, just to name a few. Robust type systems and type checking help eliminate whole categories of errors, such as null checks, missing methods, or ensuring inputs come from a constrained set of allowed values, that would be error-prone and, frankly, tiring to check manually. Tired humans make errors, but computers never get tired.

[learn you a haskell]: http://learnyouahaskell.com/

Ruby is fundamentally an immensely dynamic language, and for a long time, it seemed like a type system for Ruby would be impossible. So, of course, I was very excited with Stripe's [open-source release][] of [Sorbet][], a "fast, powerful type checker designed for Ruby," in 2019.

[open-source release]: https://sorbet.org/blog/2019/06/20/open-sourcing-sorbet
[sorbet]: https://sorbet.org/

In this post, I'll go over some of the tools I used when adding Sorbet to an existing Rails project. I will also cover some of the high-level benefits of static type and how those benefits were realized.

## Why static types?

Ruby is a dynamic language, and the flexibility that it affords is often praised as one of Ruby's defining features. Before we dive into setting up Sorbet, it's useful to consider what we hope to gain from adding static types to Ruby.

First is more runtime safety. In Ruby, any message can be sent to any object. The Ruby interpreter will happily accept `gear.work`, even if `gear` has no `work` method. You would only find out when the code runs and a `NoMethodError` pops up. In a small application, this might not be an issue. But in a large apps with many developers merging PRs and committing changes, it becomes unreasonable to expect everyone to be aware of everything at all times. Static typing helps us enforce these interfaces automatically, and prevent these errors from ever being committed or ever reaching customers.

Second is faster feedback for errors. If there's an error in your code, such as a misspelled constant name, or a message being sent to an unexpected value, you would usually not find out until the code actually runs. Depending on how long it takes for your application to boot or how long it takes to run a test, this could mean tens of seconds to a minute of time lost, or more. And that's assuming your tests actually exercise the code in a way that produces the error. With a static type checker, we can offload the burden of thinking about all these edge cases to the type checker. If we write code that could contain an error, the type checker tells us immediately, without needing to run, or indeed even write, tests to find the error.

Third is stronger interfaces and better documentation. A Ruby method on its own communicates no more information than the number of arguments it accepts. There is no information on what the method returns; no information on if an argument should be an Integer, a Float, a String, or something else. With static type definitions, we can not only provide more information about how a method must be used, but ensure that the interface is not broken. Furthermore, as the interfaces change over time, those changes ripple naturally through the type system, guiding refactoring to every consumer of the interface.

## Adding the gems

The first step is to add Sorbet to the Gemfile. Sorbet is actually composed of two gems: `sorbet` and `sorbet-runtime`.

```ruby
gem 'sorbet', group: :development
gem 'sorbet-runtime'
```

What's the difference? sorbet provides the command-line tools and libraries related to statically type checking Ruby code, and is only necessary in the dev environment. sorbet-runtime, on the other hand, provides runtime utilities, most importantly the sig decorator for defining method signatures, necessary for runtime type checking.

## RBIs and Tapioca

After adding the gems, the next step is to generate [RBI files][] for the project's dependencies. RBI ("Ruby Interface") files serve two important purposes. First, they provide type declarations for code coming from gems, which Sorbet inherently does not understand. Second, they provide declarations for code defined with metaprogramming, which Sorbet also does not understand.

[rbi files]: https://sorbet.org/docs/rbi

While Sorbet provides a built-in way to generate RBI files through its `srb` tool, this tool actually does not work very well on Rails projects. In my experience, it usually fails or somehow gets stuck while trying to interpret all the code even in a small Rails application. For Community Exchange, I used Tapioca instead.

[tapioca]: https://github.com/Shopify/tapioca

```shell-session
$ tapioca init
$ tapioca sync && tapioca dsl && tapioca todo
```

The difference between `srb` and Tapioca is how they interpret Ruby code. `srb` uses runtime reflection, which means that each Ruby source file must be required so that the classes, constants, and methods it defines can be queried. By contrast, Tapioca uses static analysis to generate an AST and plugins to interpret the AST. In my experience, Tapioca's static-analysis-based approach was much better at detecting metaprogramming than `srb`, especially for Rails applications.

## Type Checking Workflow

With Sorbet installed and RBIs generated, now we can type check! Type checking uses the `src tc` command.

While the CLI works great, it is not as smooth as type checking in other languages. With Rust or Haskell, for example, type checking is a built-in feature of the language. A Rust program with type errors cannot exist, because the compiler would refuse to compile it. Even with TypeScript, the TS source must first be compiled to JS, and a program with type errors usually cannot be created, without overriding the defaults.

By contrast, Sorbet is a layer on top of Ruby. Type checking is not a mandatory step to running code. A developer must voluntarily type check, and if they do not, nothing will remind them otherwise. Sorbet is a new thing, so most developers will be unfamiliar with it and will likely forget to work it into their personal workflows.

To address this, I also added several other peripheral tools to make the type checking workflow better.

### RuboCop Sorbet

[RuboCop Sorbet][] is a plugin for RuboCop that adds some rules to promote Sorbet best practices. To promote adoption, the most important rules are:

[rubocop sorbet]: https://github.com/Shopify/rubocop-sorbet/

- [Sorbet/HasSigil][], which enforces a minimum level of strictness in each file
- [Sorbet/ConstantsFromStrings][], which disallows dynamic constant access

[sorbet/hassigil]: https://github.com/Shopify/rubocop-sorbet/blob/master/manual/cops_sorbet.md#sorbethassigil
[sorbet/constantsfromstrings]: https://github.com/Shopify/rubocop-sorbet/blob/master/manual/cops_sorbet.md#sorbetconstantsfromstrings

The first rule, HasSigil, helps make sure that when a developer creates a new file, they include Sorbet's magic `typed`sigil. It also makes sure that the code base does not get any worse, by ensuring files never drop below a minimum level of strictness.

The second rule helps prevent a common pattern that Sorbet cannot type check. Using methods such as `const_get` or `constantize` to access a constant from a String is untyped in Sorbet, since Sorbet cannot read the String. Incidentally, avoiding these methods is also good practice from a security perspective, so this rule has multiple benefits.

### Editor plugins

Sorbet's `srb` tool also provides a [Language Server Protocol][] implementation that is compatible with most editors that have LSP integrations. This includes popular editors such as [VS Code][], [NeoVim][], [RubyMine][], and [Sublime Text][].

[language server protocol]: https://langserver.org/
[vs code]: https://github.com/danhuynhdev/sorbet-lsp
[neovim]: https://github.com/neoclide/coc.nvim/wiki/Language-servers#using-sorbet
[rubymine]: https://github.com/gtache/intellij-lsp
[sublime text]: https://github.com/sublimelsp/LSP

The command to start the LSP server is `srb tc --lsp`. Use this to configure editors that have generic LSP clients, rather than a dedicated Sorbet plugin.

I believe it is critical to have feedback from the type checker directly in your editor. This allows you to fix type errors right away, as they happen, rather than potentially writing a lot of code and needing to untangle multiple layers of errors after the fact. That tight feedback loop is critical.

### CI Integration

Type checking is optional for Ruby, and so developers may not do it before pushing their code. In order to make sure that all code is type checked, integrating Sorbet into your CI pipeline is also very important. This will be different depending on your specific configuration, but in general, you will want to run the `srb tc` command.

Because `srb tc` is very fast, and because we want to reject programs with type errors early, we decided to run Sorbet as a precondition to running any tests. If a program does not type check, it is not sound. Spending time to run tests would be a waste!

## Wins and Payoffs

Sorbet has many other features that I did not cover here. I did not mention using `sig` to annotate method parameters and return values, for example, and I did not mention any of Sorbet's runtime features.

But even with just the limited type information provided by RBIs and inference, Sorbet has already started to show value! Almost immediately after the initial PR was merged, Sorbet caught 2 issues that were not obviously problematic, and could have been easily missed by a code reviewer.

In one case, Sorbet noticed that a method defined near the bottom of a file was accidentally defined in the wrong scope, which would have caused code elsewhere that used it to hit a `NoMethodError`. This error could have been caught manually by running tests or manually testing code, but Sorbet was able to find the error without running any code at all. Sorbet is giving us an even faster feedback loop, and with an editor integration, we can see `NoMethodError`s before we even save the file.

In another, Sorbet realized that calling a method on the value of a model attribute also could have hit a `NoMethodError` because the attribute was not defined as non-null. This error would have been much more likely to slip through, as for a human to detect it, they would need to cross-reference the `schema.rb` file with the application code. Sorbet, by contrast, is able to know the types of all fields instantly, and can relieve the burden of remembering nilability from us.

## Conclusion

Adding Sorbet was relatively easy, and without a lot of effort we are already seeing benefits. For my team, the next steps will probably be adding signatures to methods and ratcheting up the Sorbet strictness level.

The Rails app I was working with is relatively small compared to other Rails apps, but the steps described in this post should be applicable no matter the size of the app. Nothing was dependent on the number of files, methods, or LOC, so Rails apps of all sizes should be able to get to the same point and start seeing similar benefits. If you work on a Ruby code base, I hope you consider adding Sorbet to it!

In closing, I also want to link to Gary Berhhardt's talk [Ideology][], from Strange Loop 2015. In a lot of popular discourse there is a tension between strong types and thorough unit tests. In the talk, Gary shows why this is a false dichotomy. In reality tests and types serve complementary purposes in an application. Neither is sufficient to guarantee a program is correct. Both are necessary.

[ideology]: https://www.destroyallsoftware.com/talks/ideology
