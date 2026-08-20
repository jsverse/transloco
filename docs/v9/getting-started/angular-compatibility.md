---
icon: puzzle
---

# Angular Compatibility

Make sure you install the version corresponding to your Angular version:

<table data-full-width="false"><thead><tr><th>Angular</th><th>@jsverse/transloco</th><th>@jsverse/transloco-*</th></tr></thead><tbody><tr><td>>=20</td><td>9.x</td><td>9.x</td></tr><tr><td>>=16 &#x3C;20</td><td>>=5 &#x3C;=8</td><td>>=5 &#x3C;=8</td></tr></tbody></table>

Transloco v9 also requires **rxjs `^6.5.3 || ^7.4.0`**.

{% hint style="info" %}
**Node.js `>=22`** is required by the command-line packages: `@jsverse/transloco-keys-manager`, `@jsverse/transloco-optimize`, `@jsverse/transloco-scoped-libs`, `@jsverse/transloco-utils` and `@jsverse/transloco-validator`.

`@jsverse/transloco-keys-manager` additionally requires `@angular/compiler >=20` and `typescript >=5.8`.
{% endhint %}

{% hint style="warning" %}
Transloco packages under the @ngneat scope will no longer recive updates.\
Update your dependency to [@jsverse/transloco](https://www.npmjs.com/package/@jsverse/transloco) and get the latest features and updates.
{% endhint %}

<table data-full-width="false"><thead><tr><th>Angular</th><th>@ngneat/transloco</th><th>@ngneat/transloco-*</th></tr></thead><tbody><tr><td>>=13 &#x3C;16</td><td>4.x</td><td>4.x</td></tr><tr><td>12</td><td>3.x</td><td>3.x</td></tr><tr><td>>=6 &#x3C;12</td><td>2.x</td><td>2.x</td></tr></tbody></table>
