import{j as e,M as V,k as A,s as te,t as ae,v as H,h as U,U as B,w as z,x as q,f as L,y as se,q as ne,T as ie,i as re,W as oe,o as de,L as le,a as ce,b as pe,c as me,d as he}from"../chunks/chunk-CkW1dBBz.js";import{u as $,b as N,o as xe,q as K,r as W,m as ue,s as ye,g as ge,l as fe,a as be,e as je}from"../chunks/chunk-Bwb-TI-m.js";import{r as I,R as ve}from"../chunks/chunk-pSdIku02.js";import{u as ke}from"../chunks/chunk-l61yfe1d.js";import{g as _}from"../chunks/chunk-BMh89R92.js";import{H as we}from"../chunks/chunk-pm1Kw1LK.js";import{a as F,P as G}from"../chunks/chunk-CIGAIrCQ.js";import{N as Ne}from"../chunks/chunk-CGX-a3s_.js";/* empty css                      *//* empty css                      *//* empty css                      */const Ie=({item:t,isOpen:s,onClose:n})=>{const c=$(),o=l=>{c({type:"OVERRIDE_ITEM_QUANTITY",payload:{itemId:t.id,quantity:l}}),n()},m=()=>{c({type:"RESET_ITEM_OVERRIDE",itemId:t.id}),n()};return e.jsxs(V,{isOpen:s,onClose:n,title:`Override ${t.name} Quantity`,size:"md",ariaLabelledBy:"override-dialog-title",children:[e.jsx("p",{className:"py-4",children:t.isOverridden?`Current quantity is overridden to ${t.quantity}`:`Current quantity is calculated to ${t.quantity}`}),e.jsxs("div",{className:"modal-action",children:[e.jsx("button",{className:"btn",onClick:n,children:"Cancel"}),t.isOverridden&&e.jsx("button",{className:"btn btn-error",onClick:m,children:"Reset to Calculated"}),e.jsx("button",{className:"btn btn-primary",onClick:()=>o(t.quantity+1),children:"Add One"}),t.quantity>0&&e.jsx("button",{className:"btn btn-primary",onClick:()=>o(t.quantity-1),children:"Remove One"})]})]})},Pe=(t,s)=>{if(t.dayIndex===void 0)return;const n=s[t.dayIndex];if(!n)return;const c=new Date(n.date);return t.dayStart!==void 0&&t.dayEnd!==void 0&&t.dayStart!==t.dayEnd?`Days ${t.dayStart+1}-${t.dayEnd+1}`:`Day ${t.dayIndex+1} - ${A(c,"MMM d")}${n.location?` (${n.location})`:""}`},C=t=>{const s=t.filter(c=>!c.isExtra),n=t.filter(c=>c.isExtra);return{baseItems:s,extraItems:n}},Te=(t,s)=>{let n=t.itemName||"";return s==="by-day"?n=t.personName||"General":t.dayIndex!==void 0&&(n+=` (Day ${t.dayIndex+1})`),n},Se=t=>t>1?` - ${t} needed`:"",Ee=({isOpen:t,onClose:s,groupedItem:n})=>{const c=$(),o=N(xe),m=_();if(!t)return null;const l=i=>{c({type:"TOGGLE_ITEM_PACKED",payload:{itemId:i.id}}),i.isPacked=!i.isPacked};let d=n.displayName;if(o==="by-day"){const{dayIndex:i,dayStart:g,dayEnd:r}=n.metadata;g!==void 0&&r!==void 0&&g!==r?d+=` (Days ${g+1}-${r+1})`:i!==void 0&&(d+=` (Day ${i+1})`)}else o==="by-person"&&n.baseItem.personName&&(d+=` (${n.baseItem.personName})`);const{baseItems:u,extraItems:x}=C(n.instances),y=i=>{const g=Te(i,o),r=Se(i.quantity),p=m.find(f=>f.id===i.categoryId),j=i.subcategoryId||n.baseItem.subcategoryId,w=m.find(f=>f.id===j);return e.jsxs("label",{className:"flex items-center gap-2 p-2 hover:bg-base-200 rounded cursor-pointer",children:[e.jsx("input",{type:"checkbox",className:"checkbox",checked:i.isPacked,onChange:()=>l(i)}),e.jsxs("div",{className:"flex flex-col gap-0.5",children:[e.jsxs("span",{children:[g,e.jsx("span",{className:"text-base-content/70",children:r})]}),p&&e.jsxs("span",{className:"text-xs text-base-content/70",children:[p.name,w&&` / ${w.name}`]})]})]},i.id)};return e.jsxs(V,{isOpen:t,onClose:s,title:`Pack ${d}`,size:"lg","data-testid":"pack-items-modal",ariaLabelledBy:"pack-dialog-title",children:[e.jsxs("div",{className:"space-y-4","data-testid":"pack-dialog-content",children:[u.length>0&&e.jsxs("div",{"data-testid":"base-items-section",children:[e.jsx("h4",{className:"font-medium mb-2",children:"Base Items"}),e.jsx("div",{className:"space-y-2",children:u.map(y)})]}),x.length>0&&e.jsxs("div",{"data-testid":"extra-items-section",children:[e.jsx("h4",{className:"font-medium mb-2",children:"Extra Items"}),e.jsx("div",{className:"space-y-2",children:x.map(y)})]})]}),e.jsx("div",{className:"modal-action",children:e.jsx("button",{className:"btn",onClick:s,"data-testid":"pack-dialog-close",children:"Close"})})]})},De=({items:t,mode:s})=>{const n=_(),c=o=>{const m=new Map;return o.forEach(l=>{const d=l.categoryId||"uncategorized";m.has(d)||m.set(d,[]),m.get(d)?.push(l)}),Array.from(m.entries()).sort((l,d)=>{const u=n.findIndex(y=>y.id===l[0]),x=n.findIndex(y=>y.id===d[0]);return u-x})};return e.jsxs("div",{className:"print-container",children:[e.jsx("style",{children:`
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

        .category-section {
          margin-bottom: 24px;
        }

        .category-title {
          font-size: 18px;
          font-weight: 600;
          color: #4a5568;
          padding: 8px 0;
          margin-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
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
          position: relative;
        }

        .checkbox.packed {
          background-color: #48bb78;
        }

        .checkbox.packed::after {
          content: '✓';
          color: white;
          font-size: 12px;
          font-weight: bold;
          text-align: center;
          line-height: 16px;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
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
      `}),Object.entries(t).map(([o,m])=>{const l=c(m);return e.jsxs("table",{className:"report-container",children:[e.jsx("thead",{className:"report-header",children:e.jsx("tr",{children:e.jsx("th",{children:e.jsx("div",{className:"section-title",children:o==="General Items"?"General Items - Packing List":`${o} - Packing List`})})})}),e.jsx("tbody",{className:"report-content",children:e.jsx("tr",{children:e.jsx("td",{children:l.map(([d,u])=>{const y=n.find(i=>i.id===d)?.name||"Other Items";return e.jsxs("div",{className:"category-section",children:[e.jsx("h3",{className:"category-title",children:y}),e.jsx("ul",{className:"item-list",children:u.map((i,g)=>e.jsxs("li",{className:"item",children:[e.jsx("div",{className:"checkbox-container",children:e.jsx("div",{className:`checkbox ${i.packed?"packed":""}`})}),e.jsxs("div",{className:"item-details",children:[e.jsx("span",{className:"item-name",children:i.name}),s==="by-day"&&i.person&&e.jsxs("span",{className:"item-context",children:["for ",i.person]}),s==="by-person"&&i.day&&i.day!=="All Days"&&e.jsxs("span",{className:"item-context",children:["for ",i.day]}),i.isExtra&&e.jsx("span",{className:"extra-badge",children:"extra"}),i.quantity>1&&e.jsxs("span",{className:"quantity-badge",children:["×",i.quantity]})]})]},`${o}-${i.name}-${g}`))})]},d)})})})})]},o)})]})},P=(t,s,n,c,o,m)=>t.flatMap(l=>{if(m){if(l.dayIndex===void 0)return[{name:s.displayName,notes:s.baseItem.notes,context:"Any Day",isExtra:l.isExtra,quantity:l.quantity,person:l.personName||o,categoryId:s.baseItem.categoryId,subcategoryId:s.baseItem.subcategoryId,packed:l.isPacked}];const d=c[l.dayIndex];if(d){const u=new Date(d.date),x=A(u,"MMM d"),y=`Day ${l.dayIndex+1} - ${x}${d.location?` - ${d.location}`:""}`;return[{name:s.displayName,notes:s.baseItem.notes,context:y,isExtra:l.isExtra,quantity:l.quantity,person:l.personName||o,categoryId:s.baseItem.categoryId,subcategoryId:s.baseItem.subcategoryId,packed:l.isPacked}]}return[]}else{const d=Pe(l,c)||"All Days";return[{name:s.displayName,notes:s.baseItem.notes,context:n,isExtra:l.isExtra,quantity:l.quantity,person:o,day:d,dayStart:l.dayStart,dayEnd:l.dayEnd,categoryId:s.baseItem.categoryId,subcategoryId:s.baseItem.subcategoryId,packed:l.isPacked}]}}),Ce=({children:t})=>{const[s,n]=ve.useState(!1);return I.useEffect(()=>{if(n(!0),!document.getElementById("print-message-root")){const o=document.createElement("div");o.id="print-message-root",o.style.display="none",document.body.appendChild(o)}const c=document.createElement("style");return c.innerHTML=`
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
    `,document.head.appendChild(c),()=>{c.remove();const o=document.getElementById("print-message-root");o&&o.remove()}},[]),s?H.createPortal(t,document.getElementById("print-message-root")||document.body):null};function Me(){const t=$(),s=N(K),{groupedItems:n,groupedGeneralItems:c}=N(W),o=N(ue),m=I.useCallback(()=>{const d=window.open("","_blank");if(!d){console.error("Failed to open print window");return}t({type:"UPDATE_PACKING_LIST_VIEW",payload:{viewMode:s.viewMode}});const u=n.flatMap(r=>{if(s.viewMode==="by-day"){if(r.type==="day"){const p=new Date(r.day.date),j=A(p,"MMM d"),w=`Day ${r.index+1} - ${j}${r.day.location?` - ${r.day.location}`:""}`;return r.items.flatMap(f=>{const{baseItems:E,extraItems:M}=C(f.instances);return[...P(E.filter(D=>D.dayIndex===r.index),f,w,o,void 0,!0),...P(M.filter(D=>D.dayIndex===r.index),f,w,o,void 0,!0)]})}else if(r.type==="person")return r.items.flatMap(p=>{const{baseItems:j,extraItems:w}=C(p.instances),f=P(j,p,"",o,r.person.name,!0),E=P(w,p,"",o,r.person.name,!0);return[...f,...E]});return[]}return r.items.flatMap(p=>{const j=r.type==="person"?r.person.name:"General",{baseItems:w,extraItems:f}=C(p.instances);return[...P(w,p,j,o),...P(f,p,j,o)]})}),x=c.flatMap(r=>{const{baseItems:p,extraItems:j}=C(r.instances);return[...P(p,r,s.viewMode==="by-day"?"Any Day":"General Items",o),...P(j,r,s.viewMode==="by-day"?"Any Day":"General Items",o)]}),y=[...u,...x].reduce((r,p)=>(r[p.context]||(r[p.context]=[]),r[p.context].push(p),r),{}),i=d.document;typeof i.open=="function"&&i.open(),i.write(`
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
    `),i.close();const g=()=>{const r=i.getElementById("print-root");if(!r){console.error("Could not find print root element");return}const p=ae.createRoot(r);H.flushSync(()=>{p.render(e.jsx(De,{items:y,mode:s.viewMode}))}),d.print()};i.readyState==="complete"?g():d.addEventListener("load",g)},[t,s,n,c,o]);I.useEffect(()=>{const d=()=>{m()},u=x=>{x.key==="p"&&(x.ctrlKey||x.metaKey&&navigator.platform.includes("Mac"))&&(x.preventDefault(),m(),x.stopPropagation())};return window.addEventListener("beforeprint",d),window.addEventListener("keydown",u),()=>{window.removeEventListener("beforeprint",d),window.removeEventListener("keydown",u)}},[m]);const l=e.jsx("div",{className:"print-message",children:e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-4",children:"Stop! 🖨️"}),e.jsx("p",{className:"text-lg mb-6",children:'Please use the "Print" button in the app to open a properly formatted view of your packing list.'}),e.jsx("p",{className:"text-base text-base-content/70",children:"The print button will open a new window with a clean, organized view of your items that's perfect for printing."})]})});return e.jsxs(e.Fragment,{children:[e.jsx(Ce,{children:l}),e.jsxs("button",{className:"btn btn-sm btn-primary",onClick:m,"data-testid":"print-button",children:[e.jsx(te,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"Print"})]})]})}const ze=()=>{const t=$(),s=N(K),{groupedItems:n,groupedGeneralItems:c}=N(W),o=N(ye),m=N(ge),l=N(fe),d=_(),u=I.useRef(null),x=I.useRef(null),{x:y,y:i}=ke();I.useEffect(()=>{const a=[...n.flatMap(k=>k.items),...c],h=a.reduce((k,T)=>k+T.totalCount,0),v=a.reduce((k,T)=>k+T.packedCount,0),b=h>0&&h===v;b&&u.current===!1&&t(be.triggerConfettiBurst({x:y,y:i})),u.current=b},[n,c,t,y,i]);const[g,r]=I.useState(null),[p,j]=I.useState(!1),[w,f]=I.useState(!1),E=a=>{t({type:"UPDATE_PACKING_LIST_VIEW",payload:{viewMode:a}})},M=a=>{t({type:"UPDATE_PACKING_LIST_VIEW",payload:{filters:{...s.filters,[a]:!s.filters[a]}}})},D=a=>{r(a),j(!0)},Y=a=>{r(a),f(!0)},O=a=>{const h=new Map;return a.forEach(v=>{const b=v.baseItem.categoryId||"uncategorized";h.has(b)||h.set(b,[]),h.get(b)?.push(v)}),Array.from(h.entries()).sort((v,b)=>{const k=d.findIndex(S=>S.id===v[0]),T=d.findIndex(S=>S.id===b[0]);return k-T})},R=a=>{const h=Math.round(a.packedCount/a.totalCount*100);return e.jsx("li",{className:"card bg-base-100 shadow-sm overflow-visible rounded-lg","data-testid":"packing-item",children:e.jsxs("div",{className:"relative flex items-center h-full gap-1.5 p-1.5 overflow-visible rounded-lg",children:[e.jsx("div",{className:"absolute inset-0 bg-success/30 h-full transition-all duration-300 ease-in-out z-0 rounded-lg",style:{width:`${h}%`}}),e.jsxs("div",{className:"relative z-10 flex items-center gap-1.5 min-w-0 flex-1 hover:z-15",children:[e.jsx("button",{className:"btn btn-xs sm:btn-sm btn-square shrink-0",onClick:()=>Y(a),"aria-label":"Pack","aria-description":`Pack ${a.displayName}`,"data-testid":"pack-button",children:e.jsx(se,{className:"w-3.5 h-3.5"})}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5 min-w-0 flex-1",children:[e.jsx("button",{className:"hover:text-primary transition-colors duration-200 truncate text-xs sm:text-sm",onClick:()=>D(a),"data-testid":"item-name",children:a.displayName}),a.baseItem.notes&&e.jsxs("div",{className:"tooltip tooltip-right before:z-[100]",children:[e.jsx("div",{className:"tooltip-content",children:a.baseItem.notes}),e.jsx(ne,{className:"w-3.5 h-3.5 stroke-current opacity-60 shrink-0","data-testid":"info-icon"})]}),a.baseItem.isOverridden&&e.jsxs("div",{className:"badge badge-warning badge-xs sm:badge-sm gap-1 shrink-0","data-testid":"override-badge",children:[e.jsx(ie,{className:"w-3 h-3 stroke-current"}),e.jsx("span",{className:"hidden xs:inline",children:"Modified"})]})]}),e.jsxs("span",{className:`shrink-0 tabular-nums text-xs sm:text-sm ${h===100?"text-success":""}`,"data-testid":"item-counts",children:[a.packedCount,"/",a.totalCount]})]})]})},`${a.baseItem.id}-${a.displayName}`)},Q=a=>{const h=O(a.items);return e.jsx("div",{className:"card bg-base-200 shadow-lg","data-testid":"packing-group",children:e.jsxs("div",{className:"card-body p-4",children:[e.jsx("h2",{className:"card-title text-lg","data-testid":"group-title",children:a.title}),e.jsx("div",{className:"space-y-6",children:h.map(([v,b])=>{const T=d.find(S=>S.id===v)?.name||"Other Items";return e.jsxs("div",{"data-testid":"category-section",children:[e.jsx("h3",{className:"text-sm font-medium text-base-content/70 mb-3","data-testid":"category-title",children:T}),e.jsx("ul",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:b.map(S=>R(S))})]},v)})})]})},a.title)},J=n.some(a=>a.items.length>0)||c.length>0,X=o?.days.length,Z=m.length>0,ee=l.length>0;return e.jsxs("div",{ref:x,className:"container mx-auto p-4",children:[e.jsxs("div",{className:"flex flex-col gap-3 mb-4",children:[e.jsx(F,{title:"Packing List",actions:e.jsx(Me,{})}),e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center gap-3",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row gap-1.5 sm:gap-3 sm:items-center",children:[e.jsx("label",{className:"text-sm font-medium text-base-content/70 sm:min-w-[4.5rem]",children:"View By"}),e.jsxs("div",{className:"join",children:[e.jsxs("button",{className:`btn btn-xs sm:btn-sm join-item ${s.viewMode==="by-day"?"btn-active":""}`,onClick:()=>E("by-day"),"data-testid":"view-mode-by-day",children:[e.jsx(U,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"By Day"})]}),e.jsxs("button",{className:`btn btn-xs sm:btn-sm join-item ${s.viewMode==="by-person"?"btn-active":""}`,onClick:()=>E("by-person"),"data-testid":"view-mode-by-person",children:[e.jsx(B,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"By Person"})]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-1.5 sm:gap-3 sm:items-center",children:[e.jsx("label",{className:"text-sm font-medium text-base-content/70 sm:min-w-[4.5rem]",children:"Show"}),e.jsxs("div",{className:"join",children:[e.jsxs("button",{className:`btn btn-xs sm:btn-sm join-item ${s.filters.packed?"btn-active":""}`,onClick:()=>M("packed"),"data-testid":"filter-packed",children:[e.jsx(z,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"Packed"})]}),e.jsxs("button",{className:`btn btn-xs sm:btn-sm join-item ${s.filters.unpacked?"btn-active":""}`,onClick:()=>M("unpacked"),"data-testid":"filter-unpacked",children:[e.jsx(q,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"Unpacked"})]})]})]})]})]}),e.jsxs(we,{title:"How to use this packing list",storageKey:"packing-list-help","data-testid":"help-blurb",children:[e.jsx("p",{children:"Your packing list helps you track and organize everything you need for your trip. Use these features to make packing easier:"}),e.jsx("h3",{className:"text-base mt-4 mb-2",children:"Key Features"}),e.jsxs("dl",{className:"grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 my-4",children:[e.jsx("dt",{className:"font-bold",children:"Views:"}),e.jsx("dd",{children:"Switch between organizing by day or by person"}),e.jsx("dt",{className:"font-bold",children:"Progress:"}),e.jsx("dd",{children:"Track what's packed with progress bars and counts"}),e.jsx("dt",{className:"font-bold",children:"Filters:"}),e.jsx("dd",{children:"Show/hide packed items or find specific things"})]}),e.jsxs("div",{className:"bg-base-200 rounded-lg p-4 my-4",children:[e.jsx("h3",{className:"text-sm font-medium mb-2",children:"Pro Tips"}),e.jsxs("p",{className:"text-sm text-base-content/70 m-0",children:["Make the most of your packing list:",e.jsx("br",{}),"• Group similar items together",e.jsx("br",{}),"• Use search to find related items",e.jsx("br",{}),"• Check off items as you pack",e.jsx("br",{}),"• Review the list before departure"]})]})]}),J?e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6",children:[n.map(a=>{let h="";if(a.type==="day"){const v=new Date(a.day.date),b=A(v,"MMM d");h=`Day ${a.index+1} - ${b}${a.day.location?` - ${a.day.location}`:""}`}else a.type==="person"&&(h=a.person.name);return Q({type:a.type,items:a.items,title:h})}),c.length>0&&e.jsx("div",{className:"card bg-base-200 shadow-lg","data-testid":"packing-group",children:e.jsxs("div",{className:"card-body p-4",children:[e.jsx("h2",{className:"card-title text-lg","data-testid":"group-title",children:"General Items"}),e.jsx("div",{className:"space-y-6",children:O(c).map(([a,h])=>{const b=d.find(k=>k.id===a)?.name||"Other Items";return e.jsxs("div",{"data-testid":"category-section",children:[e.jsx("h3",{className:"text-sm font-medium text-base-content/70 mb-3","data-testid":"category-title",children:b}),e.jsx("ul",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:h.map(k=>R(k))})]},a)})})]})})]}):e.jsx("div",{className:"card bg-base-200 shadow-lg mt-6","data-testid":"empty-state",children:e.jsxs("div",{className:"card-body",children:[e.jsx("h2",{className:"card-title",children:"Get Started"}),e.jsx("p",{className:"text-base-content/70",children:"To start building your packing list:"}),e.jsxs("ol",{className:"list-decimal list-inside space-y-4 mt-4",children:[e.jsxs("li",{children:[e.jsxs(L,{href:"/days",className:"link link-primary","data-testid":"setup-add-days-link",children:[e.jsx(U,{className:"w-4 h-4 inline-block mr-2"}),"Add trip days"]}),X&&e.jsx(z,{className:"w-4 h-4 inline-block ml-2","data-testid":"check"})]}),e.jsxs("li",{children:[e.jsxs(L,{href:"/people",className:"link link-primary","data-testid":"setup-add-people-link",children:[e.jsx(B,{className:"w-4 h-4 inline-block mr-2"}),"Add people"]}),Z&&e.jsx(z,{className:"w-4 h-4 inline-block ml-2","data-testid":"check"})]}),e.jsxs("li",{children:[e.jsxs(L,{href:"/defaults",className:"link link-primary","data-testid":"setup-add-rules-link",children:[e.jsx(q,{className:"w-4 h-4 inline-block mr-2"}),"Add packing rules"]}),ee&&e.jsx(z,{className:"w-4 h-4 inline-block ml-2","data-testid":"check"})]})]})]})}),g&&e.jsxs(e.Fragment,{children:[e.jsx(Ie,{isOpen:p,onClose:()=>{j(!1),r(null)},item:g.baseItem}),e.jsx(Ee,{isOpen:w,onClose:()=>{f(!1),r(null)},groupedItem:g})]})]})};function Ae(){return N(je)?e.jsx(G,{children:e.jsx(ze,{})}):e.jsxs(G,{children:[e.jsx(F,{title:"Packing List"}),e.jsx(Ne,{title:"No Trip Selected",message:"You need to select a trip before you can view your packing list. Each trip has its own customized list based on travelers, duration, and destinations.",actionText:"View My Trips",actionHref:"/trips"})]})}const $e=Object.freeze(Object.defineProperty({__proto__:null,default:Ae},Symbol.toStringTag,{value:"Module"})),Le="Packing List",_e=Object.freeze(Object.defineProperty({__proto__:null,default:Le},Symbol.toStringTag,{value:"Module"})),Ye={isClientRuntimeLoaded:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:!0}},onBeforeRenderEnv:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:null}},dataEnv:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:null}},onRenderClient:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/__internal/integration/onRenderClient",fileExportPathToShowToUser:[]},valueSerialized:{type:"pointer-import",value:he}},onHydrationEnd:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+onHydrationEnd.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:me}},onPageTransitionStart:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+onPageTransitionStart.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:pe}},onPageTransitionEnd:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+onPageTransitionEnd.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:ce}},Page:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/packing-list/+Page.tsx",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:$e}},hydrationCanBeAborted:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+config.ts",fileExportPathToShowToUser:["default","hydrationCanBeAborted"]},valueSerialized:{type:"js-serialized",value:!0}},Layout:{type:"cumulative",definedAtData:[{filePathToShowToUser:"/layouts/LayoutDefault.tsx",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:le}]},title:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/packing-list/+title.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:_e}},onBeforeRenderClient:{type:"cumulative",definedAtData:[{filePathToShowToUser:"vike-react-redux/__internal/onBeforeRenderClient",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:de}]},Wrapper:{type:"cumulative",definedAtData:[{filePathToShowToUser:"vike-react-redux/__internal/Wrapper",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:oe}]},Loading:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/__internal/integration/Loading",fileExportPathToShowToUser:[]},valueSerialized:{type:"pointer-import",value:re}}};export{Ye as configValuesSerialized};
