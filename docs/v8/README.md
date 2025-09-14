---
icon: globe
---

# Transloco

🩷 Want to support the project? [read here](support.md) for more information 🩵

![npm](https://img.shields.io/npm/v/@jsverse/transloco) ![Bundle Size](https://img.shields.io/bundlephobia/min/@jsverse/transloco) ![Downloads](https://img.shields.io/npm/dm/@jsverse/transloco) ![Build Status](https://github.com/jsverse/transloco/actions/workflows/ci.yml/badge.svg) [![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/jsverse/transloco/blob/master/CONTRIBUTING.md)

{% hint style="success" %}
Help Transloco improve! Found an issue or have suggestions? I welcome [contributions](https://github.com/jsverse/transloco/pulls) and [feedback](https://github.com/jsverse/transloco/issues) from the community. 🤝
{% endhint %}

Transloco allows you to define translations for your content in different languages and switch between them easily in runtime. It exposes a rich API to manage translations efficiently and cleanly. It provides multiple plugins that will improve your development experience.

Here is a small taste of the features it offers:

{% stepper %}
{% step %}
<i class="fa-shuffle">:shuffle:</i> **Runtime Language Switching**

Transloco enables dynamic language switching at runtime, allowing users to change languages without reloading the application. This feature enhances user experience by providing seamless transitions between different languages.
{% endstep %}

{% step %}
<i class="fa-soap">:soap:</i> **Clean and DRY Templates**

The library provides a structural directive (`*transloco`) that facilitates efficient translations directly within templates. This method promotes a DRY (Don't Repeat Yourself) approach by creating a single subscription per template, ensuring efficient change detection and updates.
{% endstep %}

{% step %}
<i class="fa-otter">:otter:</i> **Lazy Loading with Scope Management**

Transloco enables the lazy loading of translation files through its scoping feature. Developers can organize translations into modular files corresponding to specific features or modules, improving maintainability and scalability. By loading only the necessary translation files when a user navigates to a particular module, application performance is optimized by reducing initial bundle sizes.
{% endstep %}

{% step %}
<i class="fa-plug">:plug:</i> **Rich Plugins**

Transloco's plugin ecosystem provides powerful tools for both development and production, simplifying key extraction, translation management, and localization workflows. These plugins enhance efficiency and ensure seamless integration with Angular's dependency system.
{% endstep %}

{% step %}
<i class="fa-user-hoodie">:user-hoodie:</i> **Hackable and Modular by Design**

Transloco is built with modularity and flexibility at its core, making it highly customizable to suit diverse project needs. The library’s architecture allows developers to extend or override its behavior through plugins and custom handlers.
{% endstep %}
{% endstepper %}

These features, among others, make Transloco a powerful tool for internationalizing your Angular applications. To explore all the capabilities and learn how to implement them, we encourage you to delve deeper into the documentation.
