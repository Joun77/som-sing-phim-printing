import base from './vite.config';
export default {...base,base:'/qa-pdf-baseline/',build:{...base.build,outDir:'dist/qa-pdf-baseline',emptyOutDir:true,rollupOptions:{...base.build.rollupOptions,input:'qa-pdf.html'}}};
