import base from './vite.config';
export default {...base,base:'/qa-pdf-integrated/',build:{...base.build,outDir:'dist/qa-pdf-integrated',emptyOutDir:true,rollupOptions:{...base.build.rollupOptions,input:'qa-pdf.html'}}};
