(window.webpackJsonp=window.webpackJsonp||[]).push([[23],{103:function(e,t,n){"use strict";n.d(t,"a",(function(){return u})),n.d(t,"b",(function(){return f}));var r=n(0),a=n.n(r);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function c(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var s=a.a.createContext({}),p=function(e){var t=a.a.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},u=function(e){var t=p(e.components);return a.a.createElement(s.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.a.createElement(a.a.Fragment,{},t)}},b=a.a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,i=e.parentName,s=c(e,["components","mdxType","originalType","parentName"]),u=p(n),b=r,f=u["".concat(i,".").concat(b)]||u[b]||d[b]||o;return n?a.a.createElement(f,l(l({ref:t},s),{},{components:n})):a.a.createElement(f,l({ref:t},s))}));function f(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,i=new Array(o);i[0]=b;var l={};for(var c in t)hasOwnProperty.call(t,c)&&(l[c]=t[c]);l.originalType=e,l.mdxType="string"==typeof e?e:r,i[1]=l;for(var s=2;s<o;s++)i[s]=n[s];return a.a.createElement.apply(null,i)}return a.a.createElement.apply(null,n)}b.displayName="MDXCreateElement"},81:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return i})),n.d(t,"metadata",(function(){return l})),n.d(t,"rightToc",(function(){return c})),n.d(t,"default",(function(){return p}));var r=n(2),a=n(6),o=(n(0),n(103)),i={title:"Validation Translation files",description:"Tools - Validator | Transloco Angular translations (i18n)"},l={unversionedId:"tools/validator",id:"tools/validator",isDocsHomePage:!1,title:"Validation Translation files",description:"Tools - Validator | Transloco Angular translations (i18n)",source:"@site/docs/tools/validator.mdx",permalink:"/transloco/docs/tools/validator",editUrl:"https://github.com/ngneat/transloco/edit/master/docs/docs/tools/validator.mdx",sidebar:"docs",previous:{title:"FAQ",permalink:"/transloco/docs/faq"},next:{title:"Transloco Optimize",permalink:"/transloco/docs/tools/optimize"}},c=[{value:"Installation",id:"installation",children:[]},{value:"Usage",id:"usage",children:[]}],s={rightToc:c};function p(e){var t=e.components,n=Object(a.a)(e,["components"]);return Object(o.b)("wrapper",Object(r.a)({},s,n,{components:t,mdxType:"MDXLayout"}),Object(o.b)("p",null,"This package provides validation for translation files. It validates that the JSON is valid and that it doesn't contain duplicates keys."),Object(o.b)("h3",{id:"installation"},"Installation"),Object(o.b)("ul",null,Object(o.b)("li",{parentName:"ul"},"Set up ",Object(o.b)("a",Object(r.a)({parentName:"li"},{href:"https://github.com/typicode/husky"}),"husky")," and ",Object(o.b)("a",Object(r.a)({parentName:"li"},{href:"https://github.com/okonet/lint-staged#examples"}),"lint-staged")),Object(o.b)("li",{parentName:"ul"},"Run ",Object(o.b)("inlineCode",{parentName:"li"},"npm i @ngneat/transloco-validator"))),Object(o.b)("h3",{id:"usage"},"Usage"),Object(o.b)("pre",null,Object(o.b)("code",Object(r.a)({parentName:"pre"},{className:"language-json",metastring:'file="package.json"',file:'"package.json"'}),'{\n  "husky": {\n    "hooks": {\n      "pre-commit": "lint-staged"\n    }\n  },\n  "lint-staged": {\n    "src/i18n/*.json": ["transloco-validator"]\n  }\n}\n')),Object(o.b)("p",null,"This will make sure no one accidentally pushes an invalid translation file."))}p.isMDXComponent=!0}}]);