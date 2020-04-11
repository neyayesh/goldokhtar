myVar=null;
lastMotion=0;
lastLoadTime=0;
currentImageTime=0;
timeDiff=0;
checkingLocalMode=false;
localMode=false;
socket=null; 
loadingImage=false;
app=null;
$(document).ready(function(){
    app = new Framework7({
     root: '#app',
     name: 'نی نی پایا',
     id: 'ir.ninipaya',
     panel: {
       swipe: 'left',
     },
     routes: [
     ],
   });

    var mainView = app.views.create('.view-main');
    $("#chkNet")[0].checked=localStorage.getItem("local_net")== 'true';
    $("#chkVibrate")[0].checked=localStorage.getItem("vibrate")== 'true';
    $("#img").bind('load', function() {
        loadingImage=false;
        lastLoadTime=currentImageTime;
    });
    $("#btnConfig").click(function(e){
        var val=$("#txtHash").val().trim();
        if(val!==""){
                checkAndStart(val,true);
                app.panel.get('.panel-right-1').close();
                localStorage.setItem("local_net",$("#chkNet")[0].checked);
                localStorage.setItem("vibrate",$("#chkVibrate")[0].checked);
        }
        else{
            app.dialog.alert("لطفا شناسه کودک را وارد کنید");
        }
        
    });
    var stamp= Date.now();
    app.preloader.show("blue");
    $("#lblTime").html("در حال همگام سازی زمان");
    fetch('https://www.azinvista.com/time', {})
   .then((response) => {
           return response.json();
   })
   .then((data) => {
            $("#lblTime").html("");
            app.preloader.hide();
           var ttl=(Date.now()-stamp)/2;
           data-=ttl;
           timeDiff=data-stamp;
           var hash=getHash();
           if(hash!==null){
                   $("#txtHash").val(getHash())
                   checkAndStart(hash,false);
           }
   }).catch(function() {
        app.preloader.hide();
    });

    });
    
	
function checkAndStart(hash,msg){
    app.preloader.show("blue");
    $("#lblTime").html("در حال کنترل شناسه");
    fetch('https://www.azinvista.com/check_hash?id='+hash, {})
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        $("#lblTime").html("");
        app.preloader.hide();
        if(data==="0"){
            if(msg){
                app.dialog.alert("چنین شناسه ای ثبت نشده است");
            }
            return;
        }
        setHash(hash);
        setIp(data);
        if (socket!==null && socket.readyState === WebSocket.OPEN) {
                socket.close();
        }
        if(myVar!==null){
                clearInterval(myVar);
        }
        if($("#chkNet")[0].checked){
            socket = new WebSocket('wss://'+getIp()+':8080/image');
            socket.addEventListener('open', function (event) {
                    socket.send('Hello Server!');
                    $("#lblTime").html("ارتباط درون شبکه ای");
            });
            socket.addEventListener('message', function (event) {
                    localMode=true;
                    if(event.data==="motion" && $("#chkVibrate")[0].checked){
                            window.navigator.vibrate(200,100,200);
                    }
                    else{
                         if(!loadingImage){
                                    loadingImage=true;
                                    $("#img").attr("src","data:image/jpeg;charset=utf-8;base64, "+event.data);
                            }
                    }
                    $("#lblTime").html("ارتباط درون شبکه ای");
            });
            socket.addEventListener('error', function (event) {
                    $("#lblTime").html("مشکل در ارتباط");
            });
            socket.addEventListener('close', function (event) {
                    $("#lblTime").html("ارتباط درون شبکه ای برقرار نیست");
            });
        }
        else{
            myVar = setInterval(checkVersion, 500);
        }
    }).catch(function(){
      app.preloader.hide();  
    });

}
	
function getPrettyTime(before){
        if(before>86400){
                return Math.round(before/86400)+" روز پیش";
        }
        if(before>3600){
                return Math.round(before/3600)+" ساعت پیش";
        }		
        if(before>60){
                return Math.round(before/60)+" دقیقه پیش";
        }		
        return Math.round(before)+" ثانیه پیش";
}
function checkVersion() {
    if(lastLoadTime>0){
            var before= getServerTime()-lastLoadTime;
            before=before/1000;
            $("#lblTime").html(getPrettyTime(before));
    }
    if(getHash()===null){
            return;
    }
    var hash=getHash();
    fetch('https://www.azinvista.com/get_version?id='+hash, {})
            .then((response) => {
                    return response.json();
            })
            .then((data) => {
                    currentImageTime=data.stamp;
                    document.getElementById("img").src = "https://res.cloudinary.com/dr4eclxx1/image/upload/v" + data.version + "/ninipaya"+hash+".jpg";
                    var motion=parseInt(data.motion);
                    var differentMotion=(motion===0 || (motion>0 && motion>lastMotion));
                    if(motion!==0 && Date.now()-motion<300000 && differentMotion){
                       window.navigator.vibrate(200,100,200);
                    }
                    lastMotion=parseInt(data.motion);
            });
}
function getHash(){
   if(localStorage.getItem("hash")===null || localStorage.getItem("hash")===undefined){
                return null;
   }
   return localStorage.getItem("hash");
}
function setHash(hash){
        localStorage.setItem("hash",hash);
}
function getIp(){
   if(localStorage.getItem("ip")===null || localStorage.getItem("ip")===undefined){
                return null;
   }
   return localStorage.getItem("ip");
}
function setIp(ip){
        localStorage.setItem("ip",ip);
}
function getServerTime(){
   return Date.now()+timeDiff;
}
