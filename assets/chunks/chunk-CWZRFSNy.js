function n(t,i){return!t||i.startsWith("http")?i:(t.endsWith("/")&&i.startsWith("/")&&(t=t.slice(0,-1)),!t.endsWith("/")&&!i.startsWith("/")&&(t=t+"/"),t+i)}export{n as a};
