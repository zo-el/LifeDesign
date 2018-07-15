/*
The anchors for the community are using anchor("community",community.name) with tag : "community"

the Messages can be stored to the same anchor with a diffrent tag
*/

// Create a new chat Space / Channel
function newcommunity(community) {
    var key

    if(community.access=="public"){
      try{
        key=commit("community", community);
        commit("community_links",{Links:[{Base:anchor("community",community.name),Link:key,Tag:"community"}]})
      }catch(e){
        return (e);
      }
      return key;
    }else if (community.access=="private") {
      key=commit("community", community);
      commit("community_links",{Links:[{Base:anchor("Private_community",community.name),Link:key,Tag:"community"}]})
      //Setting Creator as Admin;
      setcommunityAdmin({"community_name":community.name});
      //Setting the Creator as Member of the community
      call("membership","addMember",{"community_name":community.name,"agent_hash":App.Agent.Hash,"agent_key":App.Key.Hash});

      return key;
    }else {
      return "INVALID ACCESS:"+community.access;
    }

}

// Get list of Public chat Spaces / community / Channels
//Can be Optimized
function getPubliccommunity() {
  if(anchorExists("community","")){
    var community_anchor = getLinks(anchor("community",""), "",{Load:true});
    //debug("community_anchor: " + JSON.stringify(community_anchor))
    if( community_anchor instanceof Error ){
        return []
    } else {
        var return_community = new Array(community_anchor.length);
        return_community=[];
          for( i=0; i<community_anchor.length; i++) {
            if(community_anchor[i].Entry.anchorText!=""){
              community=getLinks(community_anchor[i].Hash,"community",{Load:true})
              //debug("getPubliccommunity: "+JSON.stringify(community))
              return_community[i] = community[0].Entry
              return_community[i].id = community[0].Hash
            }
          }
        return return_community
    }
  }
  return [];
}

// Get list of Private chat Spaces / community / Channels
//Should Not Provide this Functionality
/*
function getPrivatecommunity() {
  if(anchorExists("Private_community","")){
    var community_anchor = getLinks(anchor("Private_community",""), "",{Load:true});
    // debug("community_anchor: " + JSON.stringify(community_anchor))
    if( community_anchor instanceof Error ){
        return []
    } else {
        var return_community = new Array(community_anchor.length);
        return_community=[];
          for( i=0; i<community_anchor.length; i++) {
            if(community_anchor[i].Entry.anchorText!=""){
              community=getLinks(community_anchor[i].Hash,"community",{Load:true})
              // debug("getPubliccommunity: "+JSON.stringify(community))
              return_community[i] = community[0].Entry
              return_community[i].id = community[0].Hash
            }
          }
        return return_community
    }
  }
  return [];
}
*/
function getcommunityByName(x){
  community=getLinks(anchor("community",x.community_name),"community",{Load:true});
  return community[0].Entry;
}

function getMyPrivatecommunity(){
  my_private_community=getLinks(App.Agent.Hash,"my_private_community");
  var my_private_community_list;
  my_private_community.forEach(function (element){
    my_private_community_list=get(element.Hash,{Local:true});
  });
  debug("My_Private_community:"+my_private_community_list);
  return my_private_community_list;
}


/*--------- Admin --------*/

// Set the User as the Admin himself
//@param : {community_name:""}
function setcommunityAdmin(x){
  commit("admin_link",{Links:[{Base:anchor("Private_community",x.community_name),Link:App.Agent.Hash,Tag:"admin"}]})
}

//@param : {community_name:""}
function getcommunityAdmin(x){
  admin = getLinks(anchor("Private_community",x.community_name), "admin",{Load:true});
  var return_admin;
  if(admin.length>=1){
    admin.forEach(function (element){
      return_admin=element.Hash;
    });
  }else{
    return "ERROR: invalid PRIVATE community name";
  }
debug("Admins are : "+return_admin);
  return return_admin;
}

// TODO:
//Can be changed to add Admins for more features
//@param : {community_name:"",agent_hash:""}
function addAdmin(x){
  commit("admin",{Links:[{Base:anchor("Private_community",x.community_name),Link:x.agent_hash,Tag:"admin"}]})
}


/*----------  Anchor API  ----------*/

function anchor(anchorType, anchorText) {
  return call('anchors', 'anchor', {
    anchorType: anchorType,
    anchorText: anchorText
  }).replace(/"/g, '');
}

function anchorExists(anchorType, anchorText) {
  return call('anchors', 'exists', {
    anchorType: anchorType,
    anchorText: anchorText
  });
}

/*----------Validation Functions-----------*/

function isValidAdmin(entry_type,entry,header,sources){
  if(sources==App.Key.Hash){
    debug("Admin is Valid:"+sources)
    return true;
  }
  else {
    debug("ERROR: Admin is not valid : "+sources)
    return false;
  }
}

function isValidcommunity(community) {
  debug("Checking if "+community+" is a valid...")
  var community = getLinks(anchor("community",""), "",{Load:true});
    ///debug("community: " + JSON.stringify(community))
  if( community instanceof Error ){
      return false
  } else {
    for( i=0; i<community.length; i++) {
      if( community[i].Entry.anchorText === community.community_name)
      debug("community "+community.community_name+"is Valid . . ")
      return true
    }
    return false
  }
  return true;
}

function isAllowed(author) {
    debug("Checking if "+author+" is a registered user...");
    debug(JSON.stringify(App));

    var registered_users = getLinks(anchor("Profiles",""), "registered_users",{Load:true});
    debug("Registered users are: "+JSON.stringify(registered_users));
    if( registered_users instanceof Error ) return false;
    for(var i=0; i < registered_users.length; i++) {
        var profile = registered_users[i].Entry;
        debug("Registered user "+i+" is " + profile.username);
        if( profile.agent_id == author) return true;
    }
    return false;
}

function genesis() {
    return true;
}

function validatePut(entry_type,entry,header,pkg,sources) {
    return validate(entry_type,entry,header,sources);
}
function validateCommit(entry_type,entry,header,pkg,sources) {
    return validate(entry_type,entry,header,sources);
}
// Local validate an entry before committing ???
function validate(entry_type,entry,header,sources) {
  if (entry_type == "admin_link") {
    return isValidAdmin(entry_type,entry,header,sources);
  }
    return isAllowed(sources[0]);
}

function validateLink(linkingEntryType,baseHash,linkHash,tag,pkg,sources){
  if(linkingEntryType=="admin_link")
  return isValidcommunity(baseHash);
  else if (linkingEntryType=="community_links") {
    return true;
  }
  else{
    return false;
  }
}
function validateMod(entry_type,hash,newHash,pkg,sources) {return true;}
function validateDel(entry_type,hash,pkg,sources) {return true;}
function validatePutPkg(entry_type) {return null}
function validateModPkg(entry_type) { return null}
function validateDelPkg(entry_type) { return null}
function validateLinkPkg(entry_type) { return null}
