/* Commit complete results; avoid truncating a file Windows may be inspecting. */
const fs=require('node:fs');
module.exports=function save(file,value){
 const bytes=Buffer.isBuffer(value)?value:Buffer.from(value);
 if(fs.existsSync(file)&&fs.readFileSync(file).equals(bytes))return;
 const temporary=file+'.'+process.pid+'.tmp';fs.writeFileSync(temporary,bytes);
 for(let attempt=0;;attempt++){
  try{fs.renameSync(temporary,file);return;}
  catch(error){if(attempt>=3||!['EPERM','EACCES','EBUSY','UNKNOWN'].includes(error.code))throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}
 }
};
