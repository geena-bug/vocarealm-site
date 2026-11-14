(function(root){
 function next(lines,index,role,event){if(index>=lines.length)return index;if(event==='reply')return lines[index].actor===role?index+1:index;if(event==='partner-ended')return role===-1||lines[index].actor!==role?index+1:index;return index;}
 function key(user){return user?'vocarealm-user-'+user.id:'vocarealm-v1';}
 const api={next,key};if(typeof module!=='undefined')module.exports=api;if(root)root.RealmLearningCore=api;
})(typeof window==='undefined'?null:window);
