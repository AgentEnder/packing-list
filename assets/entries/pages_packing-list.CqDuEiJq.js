import{j as e,M as q,k as z,s as J,t as X,v as G,h as O,U as _,w as M,x as R,f as L,y as Z,q as ee,T as te,i as ae,W as se,o as ne,L as ie,a as re,b as oe,c as de,d as le}from"../chunks/chunk-E5jMA5co.js";import{u as A,a as N,q as ce,t as V,v as H,l as pe,r as S,R as me,s as he,k as xe,j as ye,d as ue}from"../chunks/chunk-BYLHlRHj.js";import{g as U}from"../chunks/chunk-BMh89R92.js";import{H as ge}from"../chunks/chunk-CzTJFAnk.js";import{a as K,P as B}from"../chunks/chunk-B6bxDA4I.js";import{N as fe}from"../chunks/chunk-Cj0AolAR.js";/* empty css                      */import"../chunks/chunk-CWZRFSNy.js";/* empty css                      *//* empty css                      */const be=({item:t,isOpen:s,onClose:i})=>{const c=A(),r=l=>{c({type:"OVERRIDE_ITEM_QUANTITY",payload:{itemId:t.id,quantity:l}}),i()},m=()=>{c({type:"RESET_ITEM_OVERRIDE",itemId:t.id}),i()};return e.jsxs(q,{isOpen:s,onClose:i,title:`Override ${t.name} Quantity`,size:"md",ariaLabelledBy:"override-dialog-title",children:[e.jsx("p",{className:"py-4",children:t.isOverridden?`Current quantity is overridden to ${t.quantity}`:`Current quantity is calculated to ${t.quantity}`}),e.jsxs("div",{className:"modal-action",children:[e.jsx("button",{className:"btn",onClick:i,children:"Cancel"}),t.isOverridden&&e.jsx("button",{className:"btn btn-error",onClick:m,children:"Reset to Calculated"}),e.jsx("button",{className:"btn btn-primary",onClick:()=>r(t.quantity+1),children:"Add One"}),t.quantity>0&&e.jsx("button",{className:"btn btn-primary",onClick:()=>r(t.quantity-1),children:"Remove One"})]})]})},je=(t,s)=>{if(t.dayIndex===void 0)return;const i=s[t.dayIndex];if(!i)return;const c=new Date(i.date);return t.dayStart!==void 0&&t.dayEnd!==void 0&&t.dayStart!==t.dayEnd?`Days ${t.dayStart+1}-${t.dayEnd+1}`:`Day ${t.dayIndex+1} - ${z(c,"MMM d")}${i.location?` (${i.location})`:""}`},D=t=>{const s=t.filter(c=>!c.isExtra),i=t.filter(c=>c.isExtra);return{baseItems:s,extraItems:i}},ve=(t,s)=>{let i=t.itemName||"";return s==="by-day"?i=t.personName||"General":t.dayIndex!==void 0&&(i+=` (Day ${t.dayIndex+1})`),i},we=t=>t>1?` - ${t} needed`:"",Ne=({isOpen:t,onClose:s,groupedItem:i})=>{const c=A(),r=N(ce),m=U();if(!t)return null;const l=n=>{c({type:"TOGGLE_ITEM_PACKED",payload:{itemId:n.id}}),n.isPacked=!n.isPacked};let d=i.displayName;if(r==="by-day"){const{dayIndex:n,dayStart:b,dayEnd:o}=i.metadata;b!==void 0&&o!==void 0&&b!==o?d+=` (Days ${b+1}-${o+1})`:n!==void 0&&(d+=` (Day ${n+1})`)}else r==="by-person"&&i.baseItem.personName&&(d+=` (${i.baseItem.personName})`);const{baseItems:x,extraItems:h}=D(i.instances),u=n=>{const b=ve(n,r),o=we(n.quantity),p=m.find(f=>f.id===n.categoryId),g=n.subcategoryId||i.baseItem.subcategoryId,j=m.find(f=>f.id===g);return e.jsxs("label",{className:"flex items-center gap-2 p-2 hover:bg-base-200 rounded cursor-pointer",children:[e.jsx("input",{type:"checkbox",className:"checkbox",checked:n.isPacked,onChange:()=>l(n)}),e.jsxs("div",{className:"flex flex-col gap-0.5",children:[e.jsxs("span",{children:[b,e.jsx("span",{className:"text-base-content/70",children:o})]}),p&&e.jsxs("span",{className:"text-xs text-base-content/70",children:[p.name,j&&` / ${j.name}`]})]})]},n.id)};return e.jsxs(q,{isOpen:t,onClose:s,title:`Pack ${d}`,size:"lg","data-testid":"pack-items-modal",ariaLabelledBy:"pack-dialog-title",children:[e.jsxs("div",{className:"space-y-4","data-testid":"pack-dialog-content",children:[x.length>0&&e.jsxs("div",{"data-testid":"base-items-section",children:[e.jsx("h4",{className:"font-medium mb-2",children:"Base Items"}),e.jsx("div",{className:"space-y-2",children:x.map(u)})]}),h.length>0&&e.jsxs("div",{"data-testid":"extra-items-section",children:[e.jsx("h4",{className:"font-medium mb-2",children:"Extra Items"}),e.jsx("div",{className:"space-y-2",children:h.map(u)})]})]}),e.jsx("div",{className:"modal-action",children:e.jsx("button",{className:"btn",onClick:s,"data-testid":"pack-dialog-close",children:"Close"})})]})},ke=({items:t,mode:s})=>{const i=U(),c=r=>{const m=new Map;return r.forEach(l=>{const d=l.categoryId||"uncategorized";m.has(d)||m.set(d,[]),m.get(d)?.push(l)}),Array.from(m.entries()).sort((l,d)=>{const x=i.findIndex(u=>u.id===l[0]),h=i.findIndex(u=>u.id===d[0]);return x-h})};return e.jsxs("div",{className:"print-container",children:[e.jsx("style",{children:`
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
      `}),Object.entries(t).map(([r,m])=>{const l=c(m);return e.jsxs("table",{className:"report-container",children:[e.jsx("thead",{className:"report-header",children:e.jsx("tr",{children:e.jsx("th",{children:e.jsx("div",{className:"section-title",children:r==="General Items"?"General Items - Packing List":`${r} - Packing List`})})})}),e.jsx("tbody",{className:"report-content",children:e.jsx("tr",{children:e.jsx("td",{children:l.map(([d,x])=>{const u=i.find(n=>n.id===d)?.name||"Other Items";return e.jsxs("div",{className:"category-section",children:[e.jsx("h3",{className:"category-title",children:u}),e.jsx("ul",{className:"item-list",children:x.map((n,b)=>e.jsxs("li",{className:"item",children:[e.jsx("div",{className:"checkbox-container",children:e.jsx("div",{className:"checkbox"})}),e.jsxs("div",{className:"item-details",children:[e.jsx("span",{className:"item-name",children:n.name}),s==="by-day"&&n.person&&e.jsxs("span",{className:"item-context",children:["for ",n.person]}),s==="by-person"&&n.day&&n.day!=="All Days"&&e.jsxs("span",{className:"item-context",children:["for ",n.day]}),n.isExtra&&e.jsx("span",{className:"extra-badge",children:"extra"}),n.quantity>1&&e.jsxs("span",{className:"quantity-badge",children:["×",n.quantity]})]})]},`${r}-${n.name}-${b}`))})]},d)})})})})]},r)})]})},k=(t,s,i,c,r,m)=>t.flatMap(l=>{if(m){if(l.dayIndex===void 0)return[{name:s.displayName,notes:s.baseItem.notes,context:"Any Day",isExtra:l.isExtra,quantity:l.quantity,person:l.personName||r,categoryId:s.baseItem.categoryId,subcategoryId:s.baseItem.subcategoryId}];const d=c[l.dayIndex];if(d){const x=new Date(d.date),h=z(x,"MMM d"),u=`Day ${l.dayIndex+1} - ${h}${d.location?` - ${d.location}`:""}`;return[{name:s.displayName,notes:s.baseItem.notes,context:u,isExtra:l.isExtra,quantity:l.quantity,person:l.personName||r,categoryId:s.baseItem.categoryId,subcategoryId:s.baseItem.subcategoryId}]}return[]}else{const d=je(l,c)||"All Days";return[{name:s.displayName,notes:s.baseItem.notes,context:i,isExtra:l.isExtra,quantity:l.quantity,person:r,day:d,dayStart:l.dayStart,dayEnd:l.dayEnd,categoryId:s.baseItem.categoryId,subcategoryId:s.baseItem.subcategoryId}]}}),Ie=({children:t})=>{const[s,i]=me.useState(!1);return S.useEffect(()=>{if(i(!0),!document.getElementById("print-message-root")){const r=document.createElement("div");r.id="print-message-root",r.style.display="none",document.body.appendChild(r)}const c=document.createElement("style");return c.innerHTML=`
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
    `,document.head.appendChild(c),()=>{c.remove();const r=document.getElementById("print-message-root");r&&r.remove()}},[]),s?G.createPortal(t,document.getElementById("print-message-root")||document.body):null};function Te(){const t=A(),s=N(V),{groupedItems:i,groupedGeneralItems:c}=N(H),r=N(pe),m=S.useCallback(()=>{const d=window.open("","_blank");if(!d){console.error("Failed to open print window");return}t({type:"UPDATE_PACKING_LIST_VIEW",payload:{viewMode:s.viewMode}});const x=i.flatMap(o=>{if(s.viewMode==="by-day"){if(o.type==="day"){const p=new Date(o.day.date),g=z(p,"MMM d"),j=`Day ${o.index+1} - ${g}${o.day.location?` - ${o.day.location}`:""}`;return o.items.flatMap(f=>{const{baseItems:T,extraItems:C}=D(f.instances);return[...k(T.filter(E=>E.dayIndex===o.index),f,j,r,void 0,!0),...k(C.filter(E=>E.dayIndex===o.index),f,j,r,void 0,!0)]})}else if(o.type==="person")return o.items.flatMap(p=>{const{baseItems:g,extraItems:j}=D(p.instances),f=k(g,p,"",r,o.person.name,!0),T=k(j,p,"",r,o.person.name,!0);return[...f,...T]});return[]}return o.items.flatMap(p=>{const g=o.type==="person"?o.person.name:"General",{baseItems:j,extraItems:f}=D(p.instances);return[...k(j,p,g,r),...k(f,p,g,r)]})}),h=c.flatMap(o=>{const{baseItems:p,extraItems:g}=D(o.instances);return[...k(p,o,s.viewMode==="by-day"?"Any Day":"General Items",r),...k(g,o,s.viewMode==="by-day"?"Any Day":"General Items",r)]}),u=[...x,...h].reduce((o,p)=>(o[p.context]||(o[p.context]=[]),o[p.context].push(p),o),{}),n=d.document;typeof n.open=="function"&&n.open(),n.write(`
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
    `),n.close();const b=()=>{const o=n.getElementById("print-root");if(!o){console.error("Could not find print root element");return}const p=X.createRoot(o);G.flushSync(()=>{p.render(e.jsx(ke,{items:u,mode:s.viewMode}))}),d.print()};n.readyState==="complete"?b():d.addEventListener("load",b)},[t,s,i,c,r]);S.useEffect(()=>{const d=()=>{m()},x=h=>{h.key==="p"&&(h.ctrlKey||h.metaKey&&navigator.platform.includes("Mac"))&&(h.preventDefault(),m(),h.stopPropagation())};return window.addEventListener("beforeprint",d),window.addEventListener("keydown",x),()=>{window.removeEventListener("beforeprint",d),window.removeEventListener("keydown",x)}},[m]);const l=e.jsx("div",{className:"print-message",children:e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-4",children:"Stop! 🖨️"}),e.jsx("p",{className:"text-lg mb-6",children:'Please use the "Print" button in the app to open a properly formatted view of your packing list.'}),e.jsx("p",{className:"text-base text-base-content/70",children:"The print button will open a new window with a clean, organized view of your items that's perfect for printing."})]})});return e.jsxs(e.Fragment,{children:[e.jsx(Ie,{children:l}),e.jsxs("button",{className:"btn btn-sm btn-primary",onClick:m,"data-testid":"print-button",children:[e.jsx(J,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"Print"})]})]})}const Pe=()=>{const t=A(),s=N(V),{groupedItems:i,groupedGeneralItems:c}=N(H),r=N(he),m=N(xe),l=N(ye),d=U(),[x,h]=S.useState(null),[u,n]=S.useState(!1),[b,o]=S.useState(!1),p=a=>{t({type:"UPDATE_PACKING_LIST_VIEW",payload:{viewMode:a}})},g=a=>{t({type:"UPDATE_PACKING_LIST_VIEW",payload:{filters:{...s.filters,[a]:!s.filters[a]}}})},j=a=>{h(a),n(!0)},f=a=>{h(a),o(!0)},T=a=>{const y=new Map;return a.forEach(w=>{const v=w.baseItem.categoryId||"uncategorized";y.has(v)||y.set(v,[]),y.get(v)?.push(w)}),Array.from(y.entries()).sort((w,v)=>{const P=d.findIndex(I=>I.id===w[0]),$=d.findIndex(I=>I.id===v[0]);return P-$})},C=a=>{const y=Math.round(a.packedCount/a.totalCount*100);return e.jsx("li",{className:"card bg-base-100 shadow-sm overflow-visible","data-testid":"packing-item",children:e.jsxs("div",{className:"relative flex items-center gap-1.5 p-1.5 overflow-visible rounded-lg",children:[e.jsx("div",{className:"absolute inset-0 bg-success/30 transition-all duration-300 ease-in-out z-0",style:{width:`${y}%`}}),e.jsxs("div",{className:"relative z-10 flex items-center gap-1.5 min-w-0 flex-1 hover:z-15",children:[e.jsx("button",{className:"btn btn-xs sm:btn-sm btn-square shrink-0",onClick:()=>f(a),"aria-label":"Pack","aria-description":`Pack ${a.displayName}`,"data-testid":"pack-button",children:e.jsx(Z,{className:"w-3.5 h-3.5"})}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5 min-w-0 flex-1",children:[e.jsx("button",{className:"hover:text-primary transition-colors duration-200 truncate text-xs sm:text-sm",onClick:()=>j(a),"data-testid":"item-name",children:a.displayName}),a.baseItem.notes&&e.jsx("div",{className:"tooltip tooltip-right before:z-[100]","data-tip":a.baseItem.notes,children:e.jsx(ee,{className:"w-3.5 h-3.5 stroke-current opacity-60 shrink-0","data-testid":"info-icon"})}),a.baseItem.isOverridden&&e.jsxs("div",{className:"badge badge-warning badge-xs sm:badge-sm gap-1 shrink-0","data-testid":"override-badge",children:[e.jsx(te,{className:"w-3 h-3 stroke-current"}),e.jsx("span",{className:"hidden xs:inline",children:"Modified"})]})]}),e.jsxs("span",{className:`shrink-0 tabular-nums text-xs sm:text-sm ${y===100?"text-success":""}`,"data-testid":"item-counts",children:[a.packedCount,"/",a.totalCount]})]})]})},`${a.baseItem.id}-${a.displayName}`)},E=a=>{const y=T(a.items);return e.jsx("div",{className:"card bg-base-200 shadow-lg","data-testid":"packing-group",children:e.jsxs("div",{className:"card-body p-4",children:[e.jsx("h2",{className:"card-title text-lg","data-testid":"group-title",children:a.title}),e.jsx("div",{className:"space-y-6",children:y.map(([w,v])=>{const $=d.find(I=>I.id===w)?.name||"Other Items";return e.jsxs("div",{"data-testid":"category-section",children:[e.jsx("h3",{className:"text-sm font-medium text-base-content/70 mb-3","data-testid":"category-title",children:$}),e.jsx("ul",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:v.map(I=>C(I))})]},w)})})]})},a.title)},W=i.some(a=>a.items.length>0)||c.length>0,F=r?.days.length>0,Y=m.length>0,Q=l.length>0;return e.jsxs("div",{className:"container mx-auto p-4",children:[e.jsxs("div",{className:"flex flex-col gap-3 mb-4",children:[e.jsx(K,{title:"Packing List",actions:e.jsx(Te,{})}),e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center gap-3",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row gap-1.5 sm:gap-3 sm:items-center",children:[e.jsx("label",{className:"text-sm font-medium text-base-content/70 sm:min-w-[4.5rem]",children:"View By"}),e.jsxs("div",{className:"join",children:[e.jsxs("button",{className:`btn btn-xs sm:btn-sm join-item ${s.viewMode==="by-day"?"btn-active":""}`,onClick:()=>p("by-day"),"data-testid":"view-mode-by-day",children:[e.jsx(O,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"By Day"})]}),e.jsxs("button",{className:`btn btn-xs sm:btn-sm join-item ${s.viewMode==="by-person"?"btn-active":""}`,onClick:()=>p("by-person"),"data-testid":"view-mode-by-person",children:[e.jsx(_,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"By Person"})]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-1.5 sm:gap-3 sm:items-center",children:[e.jsx("label",{className:"text-sm font-medium text-base-content/70 sm:min-w-[4.5rem]",children:"Show"}),e.jsxs("div",{className:"join",children:[e.jsxs("button",{className:`btn btn-xs sm:btn-sm join-item ${s.filters.packed?"btn-active":""}`,onClick:()=>g("packed"),"data-testid":"filter-packed",children:[e.jsx(M,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"Packed"})]}),e.jsxs("button",{className:`btn btn-xs sm:btn-sm join-item ${s.filters.unpacked?"btn-active":""}`,onClick:()=>g("unpacked"),"data-testid":"filter-unpacked",children:[e.jsx(R,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"ml-1.5",children:"Unpacked"})]})]})]})]})]}),e.jsxs(ge,{title:"How to use this packing list",storageKey:"packing-list-help","data-testid":"help-blurb",children:[e.jsx("p",{children:"Your packing list helps you track and organize everything you need for your trip. Use these features to make packing easier:"}),e.jsx("h3",{className:"text-base mt-4 mb-2",children:"Key Features"}),e.jsxs("dl",{className:"grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 my-4",children:[e.jsx("dt",{className:"font-bold",children:"Views:"}),e.jsx("dd",{children:"Switch between organizing by day or by person"}),e.jsx("dt",{className:"font-bold",children:"Progress:"}),e.jsx("dd",{children:"Track what's packed with progress bars and counts"}),e.jsx("dt",{className:"font-bold",children:"Filters:"}),e.jsx("dd",{children:"Show/hide packed items or find specific things"})]}),e.jsxs("div",{className:"bg-base-200 rounded-lg p-4 my-4",children:[e.jsx("h3",{className:"text-sm font-medium mb-2",children:"Pro Tips"}),e.jsxs("p",{className:"text-sm text-base-content/70 m-0",children:["Make the most of your packing list:",e.jsx("br",{}),"• Group similar items together",e.jsx("br",{}),"• Use search to find related items",e.jsx("br",{}),"• Check off items as you pack",e.jsx("br",{}),"• Review the list before departure"]})]})]}),W?e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6",children:[i.map(a=>{let y="";if(a.type==="day"){const w=new Date(a.day.date),v=z(w,"MMM d");y=`Day ${a.index+1} - ${v}${a.day.location?` - ${a.day.location}`:""}`}else a.type==="person"&&(y=a.person.name);return E({type:a.type,items:a.items,title:y})}),c.length>0&&e.jsx("div",{className:"card bg-base-200 shadow-lg","data-testid":"packing-group",children:e.jsxs("div",{className:"card-body p-4",children:[e.jsx("h2",{className:"card-title text-lg","data-testid":"group-title",children:"General Items"}),e.jsx("div",{className:"space-y-6",children:T(c).map(([a,y])=>{const v=d.find(P=>P.id===a)?.name||"Other Items";return e.jsxs("div",{"data-testid":"category-section",children:[e.jsx("h3",{className:"text-sm font-medium text-base-content/70 mb-3","data-testid":"category-title",children:v}),e.jsx("ul",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:y.map(P=>C(P))})]},a)})})]})})]}):e.jsx("div",{className:"card bg-base-200 shadow-lg mt-6","data-testid":"empty-state",children:e.jsxs("div",{className:"card-body",children:[e.jsx("h2",{className:"card-title",children:"Get Started"}),e.jsx("p",{className:"text-base-content/70",children:"To start building your packing list:"}),e.jsxs("ol",{className:"list-decimal list-inside space-y-4 mt-4",children:[e.jsxs("li",{children:[e.jsxs(L,{href:"/days",className:"link link-primary","data-testid":"setup-add-days-link",children:[e.jsx(O,{className:"w-4 h-4 inline-block mr-2"}),"Add trip days"]}),F&&e.jsx(M,{className:"w-4 h-4 inline-block ml-2","data-testid":"check"})]}),e.jsxs("li",{children:[e.jsxs(L,{href:"/people",className:"link link-primary","data-testid":"setup-add-people-link",children:[e.jsx(_,{className:"w-4 h-4 inline-block mr-2"}),"Add people"]}),Y&&e.jsx(M,{className:"w-4 h-4 inline-block ml-2","data-testid":"check"})]}),e.jsxs("li",{children:[e.jsxs(L,{href:"/defaults",className:"link link-primary","data-testid":"setup-add-rules-link",children:[e.jsx(R,{className:"w-4 h-4 inline-block mr-2"}),"Add packing rules"]}),Q&&e.jsx(M,{className:"w-4 h-4 inline-block ml-2","data-testid":"check"})]})]})]})}),x&&e.jsxs(e.Fragment,{children:[e.jsx(be,{isOpen:u,onClose:()=>{n(!1),h(null)},item:x.baseItem}),e.jsx(Ne,{isOpen:b,onClose:()=>{o(!1),h(null)},groupedItem:x})]})]})};function Se(){return N(ue)?e.jsx(B,{children:e.jsx(Pe,{})}):e.jsxs(B,{children:[e.jsx(K,{title:"Packing List"}),e.jsx(fe,{title:"No Trip Selected",message:"You need to select a trip before you can view your packing list. Each trip has its own customized list based on travelers, duration, and destinations.",actionText:"View My Trips",actionHref:"/trips"})]})}const Ee=Object.freeze(Object.defineProperty({__proto__:null,default:Se},Symbol.toStringTag,{value:"Module"})),Re={isClientRuntimeLoaded:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:!0}},onBeforeRenderEnv:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:null}},dataEnv:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:null}},onRenderClient:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/__internal/integration/onRenderClient",fileExportPathToShowToUser:[]},valueSerialized:{type:"pointer-import",value:le}},onHydrationEnd:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+onHydrationEnd.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:de}},onPageTransitionStart:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+onPageTransitionStart.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:oe}},onPageTransitionEnd:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+onPageTransitionEnd.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:re}},Page:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/packing-list/+Page.tsx",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:Ee}},hydrationCanBeAborted:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+config.ts",fileExportPathToShowToUser:["default","hydrationCanBeAborted"]},valueSerialized:{type:"js-serialized",value:!0}},Layout:{type:"cumulative",definedAtData:[{filePathToShowToUser:"/layouts/LayoutDefault.tsx",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:ie}]},title:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+config.ts",fileExportPathToShowToUser:["default","title"]},valueSerialized:{type:"js-serialized",value:"My Vike App"}},onBeforeRenderClient:{type:"cumulative",definedAtData:[{filePathToShowToUser:"vike-react-redux/__internal/onBeforeRenderClient",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:ne}]},Wrapper:{type:"cumulative",definedAtData:[{filePathToShowToUser:"vike-react-redux/__internal/Wrapper",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:se}]},Loading:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/__internal/integration/Loading",fileExportPathToShowToUser:[]},valueSerialized:{type:"pointer-import",value:ae}}};export{Re as configValuesSerialized};
