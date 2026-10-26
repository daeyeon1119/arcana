/* ARCANA_ORIGINAL_ART is built from verified, unchanged Wikimedia JPEG bytes. */
function arcanaOriginalArt(id){
 const src=ARCANA_ORIGINAL_ART[id];
 if(!src)throw new Error('원본 카드 이미지가 없습니다: '+id);
 return src;
}
function arcanaArtSources(id){return [arcanaOriginalArt(id)];}
function arcanaImageError(img){
 const id=img.dataset.cardId;
 if(id&&ARCANA_ORIGINAL_ART[id]&&img.dataset.originalRetry!=='true'){
  img.dataset.originalRetry='true';img.src=arcanaOriginalArt(id);return;
 }
 img.onerror=null;img.dataset.artState='unavailable';img.hidden=true;
 if(!img.parentElement.querySelector('.arcana-art-error')){
  const message=document.createElement('span');message.className='arcana-art-error';message.setAttribute('role','alert');
  message.textContent='원본 카드 이미지를 표시하지 못했습니다. 앱 파일을 다시 받아 주세요.';
  img.after(message);
 }
}
function arcanaUseOriginalArt(){
 CARDS.forEach(card=>{card.img=arcanaOriginalArt(card.id);});
 document.querySelectorAll('img[data-card-id]').forEach(img=>{
  img.onerror=function(){arcanaImageError(this);};
  img.dataset.artState='original-rws-1909';img.src=arcanaOriginalArt(img.dataset.cardId);
 });
}
