import{d as $,j as e,r as A,f as V,e as T,C as F,U as K,g as W,i as H,W as Q,o as Y,L as J,a as X,b as Z,c as ee}from"../chunks/chunk-Brkuo9CE.js";import{u as S,a as f,s as z,g as U,r as v}from"../chunks/chunk-CGQ1Q5yy.js";import{f as C}from"../chunks/chunk-CMhAAk7t.js";import{H as te}from"../chunks/chunk-ChJk1oQy.js";import{C as D}from"../chunks/chunk-CVlHxTC1.js";import{I as se}from"../chunks/chunk-DRR3qQRc.js";import{T as ae}from"../chunks/chunk-C8ftuIsL.js";/* empty css                      *//* empty css                      *//* empty css                      *//**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ne=[["path",{d:"M16 16h6",key:"100bgy"}],["path",{d:"M19 13v6",key:"85cyf1"}],["path",{d:"M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14",key:"e7tb2h"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["line",{x1:"12",x2:"12",y1:"22",y2:"12",key:"a4e8g8"}]],ie=$("package-plus",ne);/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]],oe=$("printer",re),le=({item:t,isOpen:a,onClose:i})=>{const c=S(),n=d=>{c({type:"OVERRIDE_ITEM_QUANTITY",itemId:t.id,quantity:d}),i()},h=()=>{c({type:"RESET_ITEM_OVERRIDE",itemId:t.id}),i()};return a?e.jsx("div",{className:"modal modal-open",children:e.jsxs("div",{className:"modal-box",children:[e.jsxs("h3",{className:"font-bold text-lg",children:["Override ",t.name," Quantity"]}),e.jsx("p",{className:"py-4",children:t.isOverridden?`Current quantity is overridden to ${t.quantity}`:`Current quantity is calculated to ${t.quantity}`}),e.jsxs("div",{className:"modal-action",children:[e.jsx("button",{className:"btn",onClick:i,children:"Cancel"}),t.isOverridden&&e.jsx("button",{className:"btn btn-error",onClick:h,children:"Reset to Calculated"}),e.jsx("button",{className:"btn btn-primary",onClick:()=>n(t.quantity+1),children:"Add One"}),t.quantity>0&&e.jsx("button",{className:"btn btn-primary",onClick:()=>n(t.quantity-1),children:"Remove One"})]})]})}):null},O=(t,a)=>{if(t.dayIndex===void 0)return;const i=a[t.dayIndex];if(!i)return;const c=new Date(i.date);return t.dayStart!==void 0&&t.dayEnd!==void 0&&t.dayStart!==t.dayEnd?`Days ${t.dayStart+1}-${t.dayEnd+1}`:`Day ${t.dayIndex+1} - ${C(c,"MMM d")}${i.location?` (${i.location})`:""}`},I=t=>{const a=t.filter(c=>!c.isExtra),i=t.filter(c=>c.isExtra);return{baseItems:a,extraItems:i}},L=(t,a)=>{let i=t.itemName||"";return a==="by-day"?i=t.personName||"General":t.dayIndex!==void 0&&(i+=` (Day ${t.dayIndex+1})`),i},_=t=>t>1?` - ${t} needed`:"",de=({isOpen:t,onClose:a,groupedItem:i})=>{const c=S(),n=f(r=>r.packingListView.viewMode);if(!t)return null;const h=r=>{c({type:"TOGGLE_ITEM_PACKED",payload:{itemId:r.id}}),r.isPacked=!r.isPacked};let d=i.displayName;if(n==="by-day"){const{dayIndex:r,dayStart:y,dayEnd:x}=i.metadata;y!==void 0&&x!==void 0&&y!==x?d+=` (Days ${y+1}-${x+1})`:r!==void 0&&(d+=` (Day ${r+1})`)}else n==="by-person"&&i.baseItem.personName&&(d+=` (${i.baseItem.personName})`);const{baseItems:l,extraItems:p}=I(i.instances);return e.jsxs("dialog",{className:"modal",open:t,children:[e.jsxs("div",{className:"modal-box",children:[e.jsxs("h3",{className:"font-bold text-lg mb-4",children:["Pack ",d]}),e.jsxs("div",{className:"space-y-4",children:[l.length>0&&e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Base Items"}),e.jsx("div",{className:"space-y-2",children:l.map(r=>{const y=L(r,n),x=_(r.quantity);return e.jsxs("label",{className:"flex items-center gap-2 p-2 hover:bg-base-200 rounded cursor-pointer",children:[e.jsx("input",{type:"checkbox",className:"checkbox",checked:r.isPacked,onChange:()=>h(r)}),e.jsxs("span",{children:[y,e.jsx("span",{className:"text-base-content/70",children:x})]})]},r.id)})})]}),p.length>0&&e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Extra Items"}),e.jsx("div",{className:"space-y-2",children:p.map(r=>{const y=L(r,n),x=_(r.quantity);return e.jsxs("label",{className:"flex items-center gap-2 p-2 hover:bg-base-200 rounded cursor-pointer",children:[e.jsx("input",{type:"checkbox",className:"checkbox",checked:r.isPacked,onChange:()=>h(r)}),e.jsxs("span",{children:[y,e.jsx("span",{className:"text-base-content/70",children:x})]})]},r.id)})})]})]}),e.jsx("div",{className:"modal-action",children:e.jsx("button",{className:"btn",onClick:a,children:"Close"})})]}),e.jsx("form",{method:"dialog",className:"modal-backdrop",onClick:a,children:e.jsx("button",{children:"close"})})]})},ce=({items:t,mode:a})=>e.jsxs("div",{className:"print-container",children:[e.jsx("style",{children:`
        @page {
          size: letter;
          margin: 1in 0.5in;
        }

        .print-container {
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.4;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0;
          color: #2d3748;
        }

        .report-container {
          width: 100%;
          margin-bottom: 32px;
          page-break-after: always;
        }
        
        .report-container:last-child {
          margin-bottom: 0;
          page-break-after: avoid;
        }

        .report-header {
          display: table-header-group;
        }
        
        .section-title {
          font-size: 24px;
          font-weight: 800;
          color: #1a202c;
          padding: 16px 0;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 24px;
        }

        .report-content {
          display: table-row-group;
        }

        .item-list {
          list-style: none;
          margin: 0;
          padding: 0;
          columns: 2;
          column-gap: 32px;
          orphans: 4;
          widows: 4;
        }
        
        .item {
          display: flex;
          align-items: center;
          padding: 4px 0;
          gap: 8px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        
        .checkbox-container {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
        }

        .checkbox {
          width: 16px;
          height: 16px;
          border: 2px solid #718096;
          border-radius: 4px;
          display: inline-block;
        }
        
        .item-details {
          flex-grow: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          font-size: 14px;
          align-items: center;
        }
        
        .item-name {
          font-weight: 600;
          color: #2d3748;
          margin-right: 6px;
        }

        .item-context {
          color: #4a5568;
          font-weight: 500;
        }

        .quantity-badge {
          background: #edf2f7;
          color: #4a5568;
          padding: 1px 6px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          margin-left: 4px;
        }

        .extra-badge {
          background: #feebc8;
          color: #9c4221;
          padding: 1px 6px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }

        @media print {
          .item-list {
            column-fill: balance;
          }

          /* Set up named page for each section */
          .section {
            page: section;
          }

          @page section {
            @top-center {
              content: element(running-title);
            }
          }

          @page section:first {
            @top-center {
              content: none;
            }
          }

          /* Make the section title a running element */
          .section-title {
            position: running(running-title);
          }

          /* Hide the original title after the first page */
          .section-header {
            margin: 0;
            padding: 16px 0 24px;
          }
        }
      `}),Object.entries(t).map(([i,c])=>e.jsxs("table",{className:"report-container",children:[e.jsx("thead",{className:"report-header",children:e.jsx("tr",{children:e.jsx("th",{children:e.jsx("div",{className:"section-title",children:i==="General Items"?"General Items - Packing List":`${i} - Packing List`})})})}),e.jsx("tbody",{className:"report-content",children:e.jsx("tr",{children:e.jsx("td",{children:e.jsx("ul",{className:"item-list",children:c.map((n,h)=>e.jsxs("li",{className:"item",children:[e.jsx("div",{className:"checkbox-container",children:e.jsx("div",{className:"checkbox"})}),e.jsxs("div",{className:"item-details",children:[e.jsx("span",{className:"item-name",children:n.name}),a==="by-day"&&n.person&&e.jsxs("span",{className:"item-context",children:["for ",n.person]}),a==="by-person"&&n.day&&n.day!=="All Days"&&e.jsxs("span",{className:"item-context",children:["for ",n.day]}),n.isExtra&&e.jsx("span",{className:"extra-badge",children:"extra"}),n.quantity>1&&e.jsxs("span",{className:"quantity-badge",children:["×",n.quantity]})]})]},`${i}-${n.name}-${h}`))})})})})]},i))]}),j=(t,a,i,c,n,h)=>t.flatMap(d=>{if(h){if(d.dayIndex===void 0)return[{name:a.displayName,notes:a.baseItem.notes,context:"Any Day",isExtra:d.isExtra,quantity:d.quantity,person:d.personName||n}];const l=c[d.dayIndex];if(l){const p=new Date(l.date),r=C(p,"MMM d"),y=`Day ${d.dayIndex+1} - ${r}${l.location?` - ${l.location}`:""}`;return[{name:a.displayName,notes:a.baseItem.notes,context:y,isExtra:d.isExtra,quantity:d.quantity,person:d.personName||n}]}return[]}else{const l=O(d,c)||"All Days";return[{name:a.displayName,notes:a.baseItem.notes,context:i,isExtra:d.isExtra,quantity:d.quantity,person:n,day:l,dayStart:d.dayStart,dayEnd:d.dayEnd}]}}),me=()=>{const t=S(),a=f(z),{groupedItems:i,groupedGeneralItems:c}=f(U),n=f(l=>l.trip.days);v.useEffect(()=>{const l=document.createElement("style");if(l.innerHTML=`
      @media print {
        /* Hide everything except our overlay */
        body > *:not(#print-message-root) {
          display: none !important;
        }
        
        #print-message-root {
          display: block !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: white !important;
          z-index: 99999 !important;
        }

        .print-message {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 100% !important;
          padding: 2rem !important;
        }

        .print-message h2,
        .print-message p {
          display: block !important;
          color: black !important;
        }
      }
    `,document.head.appendChild(l),!document.getElementById("print-message-root")){const p=document.createElement("div");p.id="print-message-root",p.style.display="none",document.body.appendChild(p)}return()=>{l.remove();const p=document.getElementById("print-message-root");p&&p.remove()}},[]);const h=v.useCallback(()=>{const l=window.open("","_blank");if(!l){console.error("Failed to open print window");return}t({type:"UPDATE_PACKING_LIST_VIEW",payload:{viewMode:a.viewMode}});const p=i.flatMap(o=>{if(a.viewMode==="by-day"){if(o.type==="day"){const m=new Date(o.day.date),u=C(m,"MMM d"),g=`Day ${o.index+1} - ${u}${o.day.location?` - ${o.day.location}`:""}`;return o.items.flatMap(b=>{const{baseItems:N,extraItems:E}=I(b.instances);return[...j(N.filter(w=>w.dayIndex===o.index),b,g,n,void 0,!0),...j(E.filter(w=>w.dayIndex===o.index),b,g,n,void 0,!0)]})}else if(o.type==="person")return o.items.flatMap(m=>{const{baseItems:u,extraItems:g}=I(m.instances),b=j(u,m,"",n,o.person.name,!0),N=j(g,m,"",n,o.person.name,!0);return[...b,...N]});return[]}return o.items.flatMap(m=>{const u=o.type==="person"?o.person.name:"General",{baseItems:g,extraItems:b}=I(m.instances);return[...j(g,m,u,n),...j(b,m,u,n)]})}),r=c.flatMap(o=>{const{baseItems:m,extraItems:u}=I(o.instances);return[...j(m,o,a.viewMode==="by-day"?"Any Day":"General Items",n),...j(u,o,a.viewMode==="by-day"?"Any Day":"General Items",n)]}),y=[...p,...r].reduce((o,m)=>(o[m.context]||(o[m.context]=[]),o[m.context].push(m),o),{}),x=l.document;typeof x.open=="function"&&x.open(),x.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing List</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media print {
              @page {
                size: letter;
                margin: 0.5in;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            html {
              background: white;
            }
            body {
              margin: 0;
              padding: 0;
              min-height: 100vh;
              background: white;
            }
            #print-root {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
          </style>
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `),x.close();const k=()=>{const o=x.getElementById("print-root");if(!o){console.error("Could not find print root element");return}const m=V.createRoot(o);A.flushSync(()=>{m.render(e.jsx(ce,{items:y,mode:a.viewMode}))}),l.print()};x.readyState==="complete"?k():l.addEventListener("load",k)},[t,a,i,c,n]);v.useEffect(()=>{const l=r=>{h()},p=r=>{r.key==="p"&&(r.ctrlKey||r.metaKey&&navigator.platform.includes("Mac"))&&(r.preventDefault(),h(),r.stopPropagation())};return window.addEventListener("beforeprint",l),window.addEventListener("keydown",p),()=>{window.removeEventListener("beforeprint",l),window.removeEventListener("keydown",p)}},[h]);const d=e.jsx("div",{className:"print-message",children:e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-4",children:"Stop! 🖨️"}),e.jsx("p",{className:"text-lg mb-6",children:'Please use the "Print" button in the app to open a properly formatted view of your packing list.'}),e.jsx("p",{className:"text-base text-base-content/70",children:"The print button will open a new window with a clean, organized view of your items that's perfect for printing."})]})});return e.jsxs(e.Fragment,{children:[A.createPortal(d,document.getElementById("print-message-root")||document.body),e.jsxs("button",{className:"btn btn-sm btn-primary",onClick:h,children:[e.jsx(oe,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"Print"})]})]})},pe=()=>{const t=S(),a=f(z),{groupedItems:i,groupedGeneralItems:c}=f(U),n=f(s=>s.trip),h=f(s=>s.people),d=f(s=>s.defaultItemRules),[l,p]=v.useState(null),[r,y]=v.useState(!1),[x,k]=v.useState(null),[o,m]=v.useState(!1),u=s=>{t({type:"UPDATE_PACKING_LIST_VIEW",payload:{viewMode:s}})},g=s=>{t({type:"UPDATE_PACKING_LIST_VIEW",payload:{filters:s}})},b=s=>{p(s.baseItem),y(!0)},N=()=>{p(null),y(!1)},E=s=>{k(s),m(!0)},w=()=>{k(null),m(!1)},M=s=>{const P=s.packedCount/s.totalCount*100;return e.jsxs("li",{className:"relative overflow-hidden bg-base-100 rounded-lg border border-base-200 hover:border-primary transition-colors duration-200",children:[e.jsx("div",{className:"absolute inset-0 bg-success/30 transition-all duration-300 ease-in-out",style:{width:`${P}%`}}),e.jsxs("div",{className:"relative flex items-center gap-1.5 p-1.5",children:[e.jsx("button",{className:"btn btn-xs sm:btn-sm btn-square shrink-0",onClick:()=>E(s),children:e.jsx(ie,{className:"w-3.5 h-3.5"})}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5 min-w-0 flex-1",children:[e.jsx("button",{className:"hover:text-primary transition-colors duration-200 truncate text-xs sm:text-sm",onClick:()=>b(s),children:s.displayName}),s.baseItem.notes&&e.jsx("div",{className:"tooltip tooltip-right","data-tip":s.baseItem.notes,children:e.jsx(se,{className:"w-3.5 h-3.5 stroke-current opacity-60 shrink-0"})}),s.baseItem.isOverridden&&e.jsxs("div",{className:"badge badge-warning badge-xs sm:badge-sm gap-1 shrink-0",children:[e.jsx(ae,{className:"w-3 h-3 stroke-current"}),e.jsx("span",{className:"hidden xs:inline",children:"Modified"})]})]}),e.jsxs("span",{className:`shrink-0 tabular-nums text-xs sm:text-sm ${P===100?"text-success":""}`,children:[s.packedCount,"/",s.totalCount]})]})]},s.baseItem.id)},R=i.length>0||c.length>0,q=n.days.length>0,B=h.length>0,G=d.length>0;return e.jsxs("div",{className:"container mx-auto p-4",children:[e.jsxs("div",{className:"flex flex-col gap-3 mb-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("h1",{className:"text-xl sm:text-2xl font-bold",children:"Packing List"}),e.jsx(me,{})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center gap-3",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row gap-1.5 sm:gap-3 sm:items-center",children:[e.jsx("label",{className:"text-sm font-medium text-base-content/70 sm:min-w-[4.5rem]",children:"View By"}),e.jsxs("div",{className:"join",children:[e.jsx("button",{className:`btn btn-xs sm:btn-sm join-item ${a.viewMode==="by-day"?"btn-active":""}`,onClick:()=>u("by-day"),children:"By Day"}),e.jsx("button",{className:`btn btn-xs sm:btn-sm join-item ${a.viewMode==="by-person"?"btn-active":""}`,onClick:()=>u("by-person"),children:"By Person"})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-1.5 sm:gap-3 sm:items-center sm:ml-6",children:[e.jsx("label",{className:"text-sm font-medium text-base-content/70 sm:min-w-[4.5rem]",children:"Show Items"}),e.jsxs("div",{className:"grid grid-cols-3 sm:flex sm:flex-row gap-1.5 sm:gap-2",children:[e.jsxs("label",{className:"flex flex-col sm:flex-row items-center xs:flex-col sm:items-center gap-1.5 p-1.5 xs:p-2 sm:p-0 bg-base-200 sm:bg-transparent rounded-lg sm:rounded-none cursor-pointer hover:bg-base-200 transition-colors sm:px-2",children:[e.jsx("input",{type:"checkbox",className:"toggle toggle-success toggle-xs sm:toggle-sm",checked:a.filters.packed,onChange:s=>g({...a.filters,packed:s.target.checked})}),e.jsx("span",{className:"text-xs sm:text-sm",children:"Packed"})]}),e.jsxs("label",{className:"flex flex-col sm:flex-row items-center xs:flex-col sm:items-center gap-1.5 p-1.5 xs:p-2 sm:p-0 bg-base-200 sm:bg-transparent rounded-lg sm:rounded-none cursor-pointer hover:bg-base-200 transition-colors sm:px-2",children:[e.jsx("input",{type:"checkbox",className:"toggle toggle-success toggle-xs sm:toggle-sm",checked:a.filters.unpacked,onChange:s=>g({...a.filters,unpacked:s.target.checked})}),e.jsx("span",{className:"text-xs sm:text-sm",children:"Unpacked"})]}),e.jsxs("label",{className:"flex flex-col sm:flex-row items-center xs:flex-col sm:items-center gap-1.5 p-1.5 xs:p-2 sm:p-0 bg-base-200 sm:bg-transparent rounded-lg sm:rounded-none cursor-pointer hover:bg-base-200 transition-colors sm:px-2",children:[e.jsx("input",{type:"checkbox",className:"toggle toggle-success toggle-xs sm:toggle-sm",checked:a.filters.excluded,onChange:s=>g({...a.filters,excluded:s.target.checked})}),e.jsx("span",{className:"text-xs sm:text-sm",children:"Excluded"})]})]})]})]})]}),e.jsxs(te,{title:"How to use this packing list",storageKey:"packing-list-help",children:[e.jsx("p",{children:"Your packing list helps you track and organize everything you need for your trip. Use these features to make packing easier:"}),e.jsx("h3",{className:"text-base mt-4 mb-2",children:"Key Features"}),e.jsxs("dl",{className:"grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 my-4",children:[e.jsx("dt",{className:"font-bold",children:"Views:"}),e.jsx("dd",{children:"Switch between organizing by day or by person"}),e.jsx("dt",{className:"font-bold",children:"Progress:"}),e.jsx("dd",{children:"Track what's packed with progress bars and counts"}),e.jsx("dt",{className:"font-bold",children:"Filters:"}),e.jsx("dd",{children:"Show/hide packed items or find specific things"})]}),e.jsxs("div",{className:"bg-base-200 rounded-lg p-4 my-4",children:[e.jsx("h3",{className:"text-sm font-medium mb-2",children:"Pro Tips"}),e.jsxs("p",{className:"text-sm text-base-content/70 m-0",children:["Make the most of your packing list:",e.jsx("br",{}),"• Group similar items together",e.jsx("br",{}),"• Use search to find related items",e.jsx("br",{}),"• Check off items as you pack",e.jsx("br",{}),"• Review the list before departure"]})]})]}),R?e.jsxs("div",{className:"container mx-auto p-4",children:[e.jsxs("div",{className:"flex flex-col gap-6",children:[e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3",children:i.map((s,P)=>e.jsx("div",{className:"card bg-base-200 shadow-lg",children:e.jsxs("div",{className:"card-body p-3",children:[e.jsx("h2",{className:"card-title text-sm sm:text-base flex flex-wrap gap-1.5 items-center",children:s.type==="day"?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"min-w-0 truncate",children:O({dayIndex:s.index,dayStart:s.items[0]?.metadata?.dayStart,dayEnd:s.items[0]?.metadata?.dayEnd},n.days)}),s.day.location&&e.jsx("div",{className:"badge badge-primary/20 text-xs",children:s.day.location})]}):s.person.name}),e.jsx("ul",{className:"space-y-1.5",children:s.items.map(M)})]})},P))}),c.length>0&&e.jsx("div",{className:"card bg-base-200 shadow-lg",children:e.jsxs("div",{className:"card-body p-3",children:[e.jsx("h2",{className:"card-title text-sm sm:text-base",children:"General Items"}),e.jsxs("p",{className:"text-xs sm:text-sm text-base-content/70 mb-3",children:["These items are not specific to"," ",a.viewMode==="by-day"?"days":"people"]}),e.jsx("ul",{className:"space-y-1.5",children:c.map(M)})]})})]}),l&&e.jsx(le,{item:l,isOpen:r,onClose:N}),x&&e.jsx(de,{groupedItem:x,isOpen:o,onClose:w})]}):e.jsx("div",{className:"card bg-base-200 shadow-lg mt-6",children:e.jsxs("div",{className:"card-body",children:[e.jsx("h2",{className:"card-title",children:"Get Started"}),e.jsx("p",{className:"text-base-content/70",children:"To start building your packing list:"}),e.jsxs("ol",{className:"list-decimal list-inside space-y-4 mt-4",children:[e.jsxs("li",{children:[e.jsxs(T,{href:"/days",className:"link link-primary",children:[e.jsx(F,{className:"w-4 h-4 inline-block mr-2"}),"Add trip days"]}),q&&e.jsx(D,{className:"w-4 h-4 inline-block ml-2"})]}),e.jsxs("li",{children:[e.jsxs(T,{href:"/people",className:"link link-primary",children:[e.jsx(K,{className:"w-4 h-4 inline-block mr-2"}),"Add people"]}),B&&e.jsx(D,{className:"w-4 h-4 inline-block ml-2"})]}),e.jsxs("li",{children:[e.jsxs(T,{href:"/rules",className:"link link-primary",children:[e.jsx(W,{className:"w-4 h-4 inline-block mr-2"}),"Add packing rules"]}),G&&e.jsx(D,{className:"w-4 h-4 inline-block ml-2"})]})]})]})})]})};function xe(){return e.jsx(pe,{})}const he=Object.freeze(Object.defineProperty({__proto__:null,default:xe},Symbol.toStringTag,{value:"Module"})),Ie={isClientRuntimeLoaded:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:!0}},onBeforeRenderEnv:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:null}},dataEnv:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:null}},onRenderClient:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/__internal/integration/onRenderClient",fileExportPathToShowToUser:[]},valueSerialized:{type:"pointer-import",value:ee}},onPageTransitionStart:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+onPageTransitionStart.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:Z}},onPageTransitionEnd:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+onPageTransitionEnd.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:X}},Page:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/packing-list/+Page.tsx",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:he}},hydrationCanBeAborted:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/config",fileExportPathToShowToUser:["default","hydrationCanBeAborted"]},valueSerialized:{type:"js-serialized",value:!0}},Layout:{type:"cumulative",definedAtData:[{filePathToShowToUser:"/layouts/LayoutDefault.tsx",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:J}]},title:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+config.ts",fileExportPathToShowToUser:["default","title"]},valueSerialized:{type:"js-serialized",value:"My Vike App"}},onBeforeRenderClient:{type:"cumulative",definedAtData:[{filePathToShowToUser:"vike-react-redux/__internal/onBeforeRenderClient",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:Y}]},Wrapper:{type:"cumulative",definedAtData:[{filePathToShowToUser:"vike-react-redux/__internal/Wrapper",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:Q}]},Loading:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/__internal/integration/Loading",fileExportPathToShowToUser:[]},valueSerialized:{type:"pointer-import",value:H}}};export{Ie as configValuesSerialized};
