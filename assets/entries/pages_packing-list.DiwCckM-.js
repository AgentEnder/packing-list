import{j as e,D as H,E as Q,F as B,k as _,G as O,p as M,J as U,e as L,K as Y,n as J,N as X,i as Z,W as ee,o as te,L as ae,a as se,b as ne,c as ie}from"../chunks/chunk-IA2vGKWw.js";import{u as A,a as w,s as re,g as G,h as q,r as E,R as oe,i as de}from"../chunks/chunk-rZD_AvgO.js";import{f as $}from"../chunks/chunk-zYxkfuox.js";import{g as R}from"../chunks/chunk-BMh89R92.js";import{H as le}from"../chunks/chunk-CsseUkch.js";/* empty css                      *//* empty css                      *//* empty css                      */import"../chunks/chunk-B-W3y9Zy.js";const ce=t=>t.trip,me=t=>t.defaultItemRules,pe=({item:t,isOpen:a,onClose:o})=>{const c=A(),i=l=>{c({type:"OVERRIDE_ITEM_QUANTITY",payload:{itemId:t.id,quantity:l}}),o()},p=()=>{c({type:"RESET_ITEM_OVERRIDE",itemId:t.id}),o()};return a?e.jsx("div",{className:`modal ${a?"modal-open":""}`,role:"dialog","aria-modal":"true","aria-labelledby":"override-dialog-title",children:e.jsxs("div",{className:"modal-box",children:[e.jsxs("h3",{id:"override-dialog-title",className:"font-bold text-lg",children:["Override ",t.name," Quantity"]}),e.jsx("p",{className:"py-4",children:t.isOverridden?`Current quantity is overridden to ${t.quantity}`:`Current quantity is calculated to ${t.quantity}`}),e.jsxs("div",{className:"modal-action",children:[e.jsx("button",{className:"btn",onClick:o,children:"Cancel"}),t.isOverridden&&e.jsx("button",{className:"btn btn-error",onClick:p,children:"Reset to Calculated"}),e.jsx("button",{className:"btn btn-primary",onClick:()=>i(t.quantity+1),children:"Add One"}),t.quantity>0&&e.jsx("button",{className:"btn btn-primary",onClick:()=>i(t.quantity-1),children:"Remove One"})]})]})}):null},xe=(t,a)=>{if(t.dayIndex===void 0)return;const o=a[t.dayIndex];if(!o)return;const c=new Date(o.date);return t.dayStart!==void 0&&t.dayEnd!==void 0&&t.dayStart!==t.dayEnd?`Days ${t.dayStart+1}-${t.dayEnd+1}`:`Day ${t.dayIndex+1} - ${$(c,"MMM d")}${o.location?` (${o.location})`:""}`},D=t=>{const a=t.filter(c=>!c.isExtra),o=t.filter(c=>c.isExtra);return{baseItems:a,extraItems:o}},he=(t,a)=>{let o=t.itemName||"";return a==="by-day"?o=t.personName||"General":t.dayIndex!==void 0&&(o+=` (Day ${t.dayIndex+1})`),o},ye=t=>t>1?` - ${t} needed`:"",ue=({isOpen:t,onClose:a,groupedItem:o})=>{const c=A(),i=w(re),p=R();if(!t)return null;const l=n=>{c({type:"TOGGLE_ITEM_PACKED",payload:{itemId:n.id}}),n.isPacked=!n.isPacked};let d=o.displayName;if(i==="by-day"){const{dayIndex:n,dayStart:f,dayEnd:r}=o.metadata;f!==void 0&&r!==void 0&&f!==r?d+=` (Days ${f+1}-${r+1})`:n!==void 0&&(d+=` (Day ${n+1})`)}else i==="by-person"&&o.baseItem.personName&&(d+=` (${o.baseItem.personName})`);const{baseItems:h,extraItems:x}=D(o.instances),u=n=>{const f=he(n,i),r=ye(n.quantity),m=p.find(b=>b.id===n.categoryId),g=n.subcategoryId||o.baseItem.subcategoryId,j=p.find(b=>b.id===g);return e.jsxs("label",{className:"flex items-center gap-2 p-2 hover:bg-base-200 rounded cursor-pointer",children:[e.jsx("input",{type:"checkbox",className:"checkbox",checked:n.isPacked,onChange:()=>l(n)}),e.jsxs("div",{className:"flex flex-col gap-0.5",children:[e.jsxs("span",{children:[f,e.jsx("span",{className:"text-base-content/70",children:r})]}),m&&e.jsxs("span",{className:"text-xs text-base-content/70",children:[m.name,j&&` / ${j.name}`]})]})]},n.id)};return e.jsxs("div",{className:`modal ${t?"modal-open":""}`,role:"dialog","aria-modal":"true","aria-labelledby":"pack-dialog-title","data-testid":"pack-items-modal",children:[e.jsxs("div",{className:"modal-box",children:[e.jsxs("h3",{id:"pack-dialog-title",className:"font-bold text-lg","data-testid":"pack-dialog-title",children:["Pack ",d]}),e.jsxs("div",{className:"space-y-4","data-testid":"pack-dialog-content",children:[h.length>0&&e.jsxs("div",{"data-testid":"base-items-section",children:[e.jsx("h4",{className:"font-medium mb-2",children:"Base Items"}),e.jsx("div",{className:"space-y-2",children:h.map(u)})]}),x.length>0&&e.jsxs("div",{"data-testid":"extra-items-section",children:[e.jsx("h4",{className:"font-medium mb-2",children:"Extra Items"}),e.jsx("div",{className:"space-y-2",children:x.map(u)})]})]}),e.jsx("div",{className:"modal-action",children:e.jsx("button",{className:"btn",onClick:a,"data-testid":"pack-dialog-close",children:"Close"})})]}),e.jsx("form",{method:"dialog",className:"modal-backdrop",onClick:a,children:e.jsx("button",{children:"close"})})]})},ge=({items:t,mode:a})=>{const o=R(),c=i=>{const p=new Map;return i.forEach(l=>{const d=l.categoryId||"uncategorized";p.has(d)||p.set(d,[]),p.get(d)?.push(l)}),Array.from(p.entries()).sort((l,d)=>{const h=o.findIndex(u=>u.id===l[0]),x=o.findIndex(u=>u.id===d[0]);return h-x})};return e.jsxs("div",{className:"print-container",children:[e.jsx("style",{children:`
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
      `}),Object.entries(t).map(([i,p])=>{const l=c(p);return e.jsxs("table",{className:"report-container",children:[e.jsx("thead",{className:"report-header",children:e.jsx("tr",{children:e.jsx("th",{children:e.jsx("div",{className:"section-title",children:i==="General Items"?"General Items - Packing List":`${i} - Packing List`})})})}),e.jsx("tbody",{className:"report-content",children:e.jsx("tr",{children:e.jsx("td",{children:l.map(([d,h])=>{const u=o.find(n=>n.id===d)?.name||"Other Items";return e.jsxs("div",{className:"category-section",children:[e.jsx("h3",{className:"category-title",children:u}),e.jsx("ul",{className:"item-list",children:h.map((n,f)=>e.jsxs("li",{className:"item",children:[e.jsx("div",{className:"checkbox-container",children:e.jsx("div",{className:"checkbox"})}),e.jsxs("div",{className:"item-details",children:[e.jsx("span",{className:"item-name",children:n.name}),a==="by-day"&&n.person&&e.jsxs("span",{className:"item-context",children:["for ",n.person]}),a==="by-person"&&n.day&&n.day!=="All Days"&&e.jsxs("span",{className:"item-context",children:["for ",n.day]}),n.isExtra&&e.jsx("span",{className:"extra-badge",children:"extra"}),n.quantity>1&&e.jsxs("span",{className:"quantity-badge",children:["×",n.quantity]})]})]},`${i}-${n.name}-${f}`))})]},d)})})})})]},i)})]})},k=(t,a,o,c,i,p)=>t.flatMap(l=>{if(p){if(l.dayIndex===void 0)return[{name:a.displayName,notes:a.baseItem.notes,context:"Any Day",isExtra:l.isExtra,quantity:l.quantity,person:l.personName||i,categoryId:a.baseItem.categoryId,subcategoryId:a.baseItem.subcategoryId}];const d=c[l.dayIndex];if(d){const h=new Date(d.date),x=$(h,"MMM d"),u=`Day ${l.dayIndex+1} - ${x}${d.location?` - ${d.location}`:""}`;return[{name:a.displayName,notes:a.baseItem.notes,context:u,isExtra:l.isExtra,quantity:l.quantity,person:l.personName||i,categoryId:a.baseItem.categoryId,subcategoryId:a.baseItem.subcategoryId}]}return[]}else{const d=xe(l,c)||"All Days";return[{name:a.displayName,notes:a.baseItem.notes,context:o,isExtra:l.isExtra,quantity:l.quantity,person:i,day:d,dayStart:l.dayStart,dayEnd:l.dayEnd,categoryId:a.baseItem.categoryId,subcategoryId:a.baseItem.subcategoryId}]}}),be=({children:t})=>{const[a,o]=oe.useState(!1);return E.useEffect(()=>{if(o(!0),!document.getElementById("print-message-root")){const i=document.createElement("div");i.id="print-message-root",i.style.display="none",document.body.appendChild(i)}const c=document.createElement("style");return c.innerHTML=`
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
    `,document.head.appendChild(c),()=>{c.remove();const i=document.getElementById("print-message-root");i&&i.remove()}},[]),a?B.createPortal(t,document.getElementById("print-message-root")||document.body):null},fe=()=>{const t=A(),a=w(G),{groupedItems:o,groupedGeneralItems:c}=w(q),i=w(d=>d.trip.days),p=E.useCallback(()=>{const d=window.open("","_blank");if(!d){console.error("Failed to open print window");return}t({type:"UPDATE_PACKING_LIST_VIEW",payload:{viewMode:a.viewMode}});const h=o.flatMap(r=>{if(a.viewMode==="by-day"){if(r.type==="day"){const m=new Date(r.day.date),g=$(m,"MMM d"),j=`Day ${r.index+1} - ${g}${r.day.location?` - ${r.day.location}`:""}`;return r.items.flatMap(b=>{const{baseItems:P,extraItems:C}=D(b.instances);return[...k(P.filter(S=>S.dayIndex===r.index),b,j,i,void 0,!0),...k(C.filter(S=>S.dayIndex===r.index),b,j,i,void 0,!0)]})}else if(r.type==="person")return r.items.flatMap(m=>{const{baseItems:g,extraItems:j}=D(m.instances),b=k(g,m,"",i,r.person.name,!0),P=k(j,m,"",i,r.person.name,!0);return[...b,...P]});return[]}return r.items.flatMap(m=>{const g=r.type==="person"?r.person.name:"General",{baseItems:j,extraItems:b}=D(m.instances);return[...k(j,m,g,i),...k(b,m,g,i)]})}),x=c.flatMap(r=>{const{baseItems:m,extraItems:g}=D(r.instances);return[...k(m,r,a.viewMode==="by-day"?"Any Day":"General Items",i),...k(g,r,a.viewMode==="by-day"?"Any Day":"General Items",i)]}),u=[...h,...x].reduce((r,m)=>(r[m.context]||(r[m.context]=[]),r[m.context].push(m),r),{}),n=d.document;typeof n.open=="function"&&n.open(),n.write(`
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
    `),n.close();const f=()=>{const r=n.getElementById("print-root");if(!r){console.error("Could not find print root element");return}const m=Q.createRoot(r);B.flushSync(()=>{m.render(e.jsx(ge,{items:u,mode:a.viewMode}))}),d.print()};n.readyState==="complete"?f():d.addEventListener("load",f)},[t,a,o,c,i]);E.useEffect(()=>{const d=()=>{p()},h=x=>{x.key==="p"&&(x.ctrlKey||x.metaKey&&navigator.platform.includes("Mac"))&&(x.preventDefault(),p(),x.stopPropagation())};return window.addEventListener("beforeprint",d),window.addEventListener("keydown",h),()=>{window.removeEventListener("beforeprint",d),window.removeEventListener("keydown",h)}},[p]);const l=e.jsx("div",{className:"print-message",children:e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-4",children:"Stop! 🖨️"}),e.jsx("p",{className:"text-lg mb-6",children:'Please use the "Print" button in the app to open a properly formatted view of your packing list.'}),e.jsx("p",{className:"text-base text-base-content/70",children:"The print button will open a new window with a clean, organized view of your items that's perfect for printing."})]})});return e.jsxs(e.Fragment,{children:[e.jsx(be,{children:l}),e.jsxs("button",{className:"btn btn-sm btn-primary",onClick:p,"data-testid":"print-button",children:[e.jsx(H,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"Print"})]})]})},je=()=>{const t=A(),a=w(G),{groupedItems:o,groupedGeneralItems:c}=w(q),i=w(ce),p=w(de),l=w(me),d=R(),[h,x]=E.useState(null),[u,n]=E.useState(!1),[f,r]=E.useState(!1),m=s=>{t({type:"UPDATE_PACKING_LIST_VIEW",payload:{viewMode:s}})},g=s=>{t({type:"UPDATE_PACKING_LIST_VIEW",payload:{filters:{...a.filters,[s]:!a.filters[s]}}})},j=s=>{x(s),n(!0)},b=s=>{x(s),r(!0)},P=s=>{const y=new Map;return s.forEach(N=>{const v=N.baseItem.categoryId||"uncategorized";y.has(v)||y.set(v,[]),y.get(v)?.push(N)}),Array.from(y.entries()).sort((N,v)=>{const T=d.findIndex(I=>I.id===N[0]),z=d.findIndex(I=>I.id===v[0]);return T-z})},C=s=>{const y=Math.round(s.packedCount/s.totalCount*100);return e.jsx("li",{className:"card bg-base-100 shadow-sm","data-testid":"packing-item",children:e.jsxs("div",{className:"relative flex items-center gap-1.5 p-1.5 overflow-hidden rounded-lg",children:[e.jsx("div",{className:"absolute inset-0 bg-success/30 transition-all duration-300 ease-in-out z-0",style:{width:`${y}%`}}),e.jsxs("div",{className:"relative z-10 flex items-center gap-1.5 min-w-0 flex-1",children:[e.jsx("button",{className:"btn btn-xs sm:btn-sm btn-square shrink-0",onClick:()=>b(s),"aria-label":"Pack","aria-description":`Pack ${s.displayName}`,"data-testid":"pack-button",children:e.jsx(Y,{className:"w-3.5 h-3.5"})}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5 min-w-0 flex-1",children:[e.jsx("button",{className:"hover:text-primary transition-colors duration-200 truncate text-xs sm:text-sm",onClick:()=>j(s),"data-testid":"item-name",children:s.displayName}),s.baseItem.notes&&e.jsx("div",{className:"tooltip tooltip-right","data-tip":s.baseItem.notes,children:e.jsx(J,{className:"w-3.5 h-3.5 stroke-current opacity-60 shrink-0","data-testid":"info-icon"})}),s.baseItem.isOverridden&&e.jsxs("div",{className:"badge badge-warning badge-xs sm:badge-sm gap-1 shrink-0","data-testid":"override-badge",children:[e.jsx(X,{className:"w-3 h-3 stroke-current"}),e.jsx("span",{className:"hidden xs:inline",children:"Modified"})]})]}),e.jsxs("span",{className:`shrink-0 tabular-nums text-xs sm:text-sm ${y===100?"text-success":""}`,"data-testid":"item-counts",children:[s.packedCount,"/",s.totalCount]})]})]})},`${s.baseItem.id}-${s.displayName}`)},S=s=>{const y=P(s.items);return e.jsx("div",{className:"card bg-base-200 shadow-lg","data-testid":"packing-group",children:e.jsxs("div",{className:"card-body p-4",children:[e.jsx("h2",{className:"card-title text-lg","data-testid":"group-title",children:s.title}),e.jsx("div",{className:"space-y-6",children:y.map(([N,v])=>{const z=d.find(I=>I.id===N)?.name||"Other Items";return e.jsxs("div",{"data-testid":"category-section",children:[e.jsx("h3",{className:"text-sm font-medium text-base-content/70 mb-3","data-testid":"category-title",children:z}),e.jsx("ul",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:v.map(I=>C(I))})]},N)})})]})},s.title)},V=o.some(s=>s.items.length>0)||c.length>0,K=i.days.length>0,F=p.length>0,W=l.length>0;return e.jsxs("div",{className:"container mx-auto p-4",children:[e.jsxs("div",{className:"flex flex-col gap-3 mb-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("h1",{className:"text-xl sm:text-2xl font-bold",children:"Packing List"}),e.jsx(fe,{})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center gap-3",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row gap-1.5 sm:gap-3 sm:items-center",children:[e.jsx("label",{className:"text-sm font-medium text-base-content/70 sm:min-w-[4.5rem]",children:"View By"}),e.jsxs("div",{className:"join",children:[e.jsxs("button",{className:`btn btn-xs sm:btn-sm join-item ${a.viewMode==="by-day"?"btn-active":""}`,onClick:()=>m("by-day"),"data-testid":"view-mode-by-day",children:[e.jsx(_,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"By Day"})]}),e.jsxs("button",{className:`btn btn-xs sm:btn-sm join-item ${a.viewMode==="by-person"?"btn-active":""}`,onClick:()=>m("by-person"),"data-testid":"view-mode-by-person",children:[e.jsx(O,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"By Person"})]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-1.5 sm:gap-3 sm:items-center",children:[e.jsx("label",{className:"text-sm font-medium text-base-content/70 sm:min-w-[4.5rem]",children:"Show"}),e.jsxs("div",{className:"join",children:[e.jsxs("button",{className:`btn btn-xs sm:btn-sm join-item ${a.filters.packed?"btn-active":""}`,onClick:()=>g("packed"),"data-testid":"filter-packed",children:[e.jsx(M,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"Packed"})]}),e.jsxs("button",{className:`btn btn-xs sm:btn-sm join-item ${a.filters.unpacked?"btn-active":""}`,onClick:()=>g("unpacked"),"data-testid":"filter-unpacked",children:[e.jsx(U,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"Unpacked"})]})]})]})]})]}),e.jsxs(le,{title:"How to use this packing list",storageKey:"packing-list-help","data-testid":"help-blurb",children:[e.jsx("p",{children:"Your packing list helps you track and organize everything you need for your trip. Use these features to make packing easier:"}),e.jsx("h3",{className:"text-base mt-4 mb-2",children:"Key Features"}),e.jsxs("dl",{className:"grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 my-4",children:[e.jsx("dt",{className:"font-bold",children:"Views:"}),e.jsx("dd",{children:"Switch between organizing by day or by person"}),e.jsx("dt",{className:"font-bold",children:"Progress:"}),e.jsx("dd",{children:"Track what's packed with progress bars and counts"}),e.jsx("dt",{className:"font-bold",children:"Filters:"}),e.jsx("dd",{children:"Show/hide packed items or find specific things"})]}),e.jsxs("div",{className:"bg-base-200 rounded-lg p-4 my-4",children:[e.jsx("h3",{className:"text-sm font-medium mb-2",children:"Pro Tips"}),e.jsxs("p",{className:"text-sm text-base-content/70 m-0",children:["Make the most of your packing list:",e.jsx("br",{}),"• Group similar items together",e.jsx("br",{}),"• Use search to find related items",e.jsx("br",{}),"• Check off items as you pack",e.jsx("br",{}),"• Review the list before departure"]})]})]}),V?e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6",children:[o.map(s=>{let y="";if(s.type==="day"){const N=new Date(s.day.date),v=$(N,"MMM d");y=`Day ${s.index+1} - ${v}${s.day.location?` - ${s.day.location}`:""}`}else s.type==="person"&&(y=s.person.name);return S({type:s.type,items:s.items,title:y})}),c.length>0&&e.jsx("div",{className:"card bg-base-200 shadow-lg","data-testid":"packing-group",children:e.jsxs("div",{className:"card-body p-4",children:[e.jsx("h2",{className:"card-title text-lg","data-testid":"group-title",children:"General Items"}),e.jsx("div",{className:"space-y-6",children:P(c).map(([s,y])=>{const v=d.find(T=>T.id===s)?.name||"Other Items";return e.jsxs("div",{"data-testid":"category-section",children:[e.jsx("h3",{className:"text-sm font-medium text-base-content/70 mb-3","data-testid":"category-title",children:v}),e.jsx("ul",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:y.map(T=>C(T))})]},s)})})]})})]}):e.jsx("div",{className:"card bg-base-200 shadow-lg mt-6","data-testid":"empty-state",children:e.jsxs("div",{className:"card-body",children:[e.jsx("h2",{className:"card-title",children:"Get Started"}),e.jsx("p",{className:"text-base-content/70",children:"To start building your packing list:"}),e.jsxs("ol",{className:"list-decimal list-inside space-y-4 mt-4",children:[e.jsxs("li",{children:[e.jsxs(L,{href:"/days",className:"link link-primary",dataTestId:"setup-add-days-link",children:[e.jsx(_,{className:"w-4 h-4 inline-block mr-2"}),"Add trip days"]}),K&&e.jsx(M,{className:"w-4 h-4 inline-block ml-2","data-testid":"check"})]}),e.jsxs("li",{children:[e.jsxs(L,{href:"/people",className:"link link-primary",dataTestId:"setup-add-people-link",children:[e.jsx(O,{className:"w-4 h-4 inline-block mr-2"}),"Add people"]}),F&&e.jsx(M,{className:"w-4 h-4 inline-block ml-2","data-testid":"check"})]}),e.jsxs("li",{children:[e.jsxs(L,{href:"/rules",className:"link link-primary",dataTestId:"setup-add-rules-link",children:[e.jsx(U,{className:"w-4 h-4 inline-block mr-2"}),"Add packing rules"]}),W&&e.jsx(M,{className:"w-4 h-4 inline-block ml-2","data-testid":"check"})]})]})]})}),h&&e.jsxs(e.Fragment,{children:[e.jsx(pe,{isOpen:u,onClose:()=>{n(!1),x(null)},item:h.baseItem}),e.jsx(ue,{isOpen:f,onClose:()=>{r(!1),x(null)},groupedItem:h})]})]})};function ve(){return e.jsx(je,{})}const Ne=Object.freeze(Object.defineProperty({__proto__:null,default:ve},Symbol.toStringTag,{value:"Module"})),Me={isClientRuntimeLoaded:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:!0}},onBeforeRenderEnv:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:null}},dataEnv:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:null}},onRenderClient:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/__internal/integration/onRenderClient",fileExportPathToShowToUser:[]},valueSerialized:{type:"pointer-import",value:ie}},onPageTransitionStart:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+onPageTransitionStart.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:ne}},onPageTransitionEnd:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+onPageTransitionEnd.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:se}},Page:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/packing-list/+Page.tsx",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:Ne}},hydrationCanBeAborted:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/config",fileExportPathToShowToUser:["default","hydrationCanBeAborted"]},valueSerialized:{type:"js-serialized",value:!0}},Layout:{type:"cumulative",definedAtData:[{filePathToShowToUser:"/layouts/LayoutDefault.tsx",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:ae}]},title:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+config.ts",fileExportPathToShowToUser:["default","title"]},valueSerialized:{type:"js-serialized",value:"My Vike App"}},onBeforeRenderClient:{type:"cumulative",definedAtData:[{filePathToShowToUser:"vike-react-redux/__internal/onBeforeRenderClient",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:te}]},Wrapper:{type:"cumulative",definedAtData:[{filePathToShowToUser:"vike-react-redux/__internal/Wrapper",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:ee}]},Loading:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/__internal/integration/Loading",fileExportPathToShowToUser:[]},valueSerialized:{type:"pointer-import",value:Z}}};export{Me as configValuesSerialized};
