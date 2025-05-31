import{d as h,j as e}from"./chunk-Brkuo9CE.js";import{r as o}from"./chunk-CGQ1Q5yy.js";/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],b=h("x",m),p="help-all",u=t=>{if(typeof window>"u")return!1;const a=`help-${t}`,s=localStorage.getItem(a)==="hidden",l=localStorage.getItem(p)==="hidden";return s||l},g=({title:t,children:a,storageKey:s})=>{const[l,i]=o.useState(!1),[n,d]=o.useState(!u(s)),c=`help-${s}`;o.useEffect(()=>{i(!0)},[]);const r=()=>{localStorage.setItem(c,"hidden"),d(!1)};return!l||!n?null:e.jsx("div",{className:"card bg-base-100 shadow-xl mb-6",children:e.jsxs("div",{className:"card-body prose relative",children:[e.jsx("button",{onClick:r,className:"btn btn-sm btn-ghost btn-circle absolute right-2 top-2","aria-label":"Dismiss help",children:e.jsx(b,{className:"h-4 w-4"})}),e.jsx("h2",{className:"card-title",children:t}),a]})})};export{g as H,b as X,p as a};
