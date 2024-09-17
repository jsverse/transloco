"use strict";(self.webpackChunktransloco_docs=self.webpackChunktransloco_docs||[]).push([[5731],{609:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>l,contentTitle:()=>a,default:()=>g,frontMatter:()=>r,metadata:()=>i,toc:()=>c});var t=s(2540),o=s(3023);const r={title:"Persist Lang",description:"Plugins - Persist Lang | Transloco Angular i18n"},a=void 0,i={id:"plugins/persist-lang",title:"Persist Lang",description:"Plugins - Persist Lang | Transloco Angular i18n",source:"@site/docs/plugins/persist-lang.mdx",sourceDirName:"plugins",slug:"/plugins/persist-lang",permalink:"/transloco/docs/plugins/persist-lang",draft:!1,unlisted:!1,editUrl:"https://github.com/jsverse/transloco/edit/master/docs/docs/plugins/persist-lang.mdx",tags:[],version:"current",frontMatter:{title:"Persist Lang",description:"Plugins - Persist Lang | Transloco Angular i18n"},sidebar:"docs",previous:{title:"Persist Translations",permalink:"/transloco/docs/plugins/persist-translations"},next:{title:"Preload Languages",permalink:"/transloco/docs/plugins/preload-langs"}},l={},c=[{value:"Installation",id:"installation",level:2},{value:"Usage",id:"usage",level:2}];function d(e){const n={code:"code",h2:"h2",p:"p",pre:"pre",...(0,o.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:"This plugin provides the functionality of persisting the active language to the provided storage."}),"\n",(0,t.jsx)(n.h2,{id:"installation",children:"Installation"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-bash",children:"npm install @jsverse/transloco-persist-lang\n"})}),"\n",(0,t.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,t.jsxs)(n.p,{children:["Add persist lang providers using the into the ",(0,t.jsx)(n.code,{children:"TranslocoRootModule"}),"/",(0,t.jsx)(n.code,{children:"app.config.ts"}),", and provide the storage you would like to use:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-ts",metastring:'title="transloco-root.module.ts"',children:"import { provideTranslocoPersistLang } from '@jsverse/transloco-persist-lang';\n\n@NgModule({\n  providers: [\n    provideTranslocoPersistLang({\n      storage: {\n        useValue: localStorage,\n      },\n    }),\n  ],\n  ...\n})\nexport class TranslocoRootModule {}\n"})}),"\n",(0,t.jsx)(n.p,{children:"When the user changes the current language, the plugin will keep it in the provided storage and set it as active when the user returns to the application."}),"\n",(0,t.jsxs)(n.p,{children:["By default, the plugin will use the cached language if available otherwise it will use the default language provided in the config. You can always change this behavior by providing a ",(0,t.jsx)(n.code,{children:"getLangFn"})," option:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-ts",metastring:'title="transloco-root.module.ts"',children:"import { provideTranslocoPersistLang } from '@jsverse/transloco-persist-lang';\n\nexport function getLangFn({\n  cachedLang,\n  browserLang,\n  cultureLang,\n  defaultLang,\n}) {\n  return yourLogic;\n}\n\n@NgModule({\n  providers: [\n    provideTranslocoPersistLang({\n      getLangFn,\n      storage: {\n        useValue: localStorage,\n      },\n    }),\n  ],\n  ...\n})\nexport class TranslocoRootModule {}\n"})}),"\n",(0,t.jsxs)(n.p,{children:["The plugin also provides a ",(0,t.jsx)(n.code,{children:"cookiesStorage"})," function that you can use to save the language in a cookie. (SSR advantage)"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-ts",metastring:'title="transloco-root.module.ts"',children:"import { provideTranslocoPersistLang, cookiesStorage } from '@jsverse/transloco-persist-lang';\n\n@NgModule({\n  imports: [\n    provideTranslocoPersistLang({\n      storage: {\n        useValue: cookiesStorage(),\n      },\n    }),\n  ],\n  ...\n})\nexport class TranslocoRootModule {}\n"})})]})}function g(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(d,{...e})}):d(e)}},3023:(e,n,s)=>{s.d(n,{R:()=>a,x:()=>i});var t=s(3696);const o={},r=t.createContext(o);function a(e){const n=t.useContext(r);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function i(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:a(e.components),t.createElement(r.Provider,{value:n},e.children)}}}]);