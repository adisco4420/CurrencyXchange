
$(document).ready(function (){
	loadCurrency();
});

//service worker

if(navigator.serviceWorker){
	
	registerServiceWorker();
	navigator.serviceWorker.addEventListener('controllerchange', function (){
		window.location.reload();
	});
}else{
	console.log('browser does not support Services Worker !');
}

function registerServiceWorker() {
	navigator.serviceWorker.register('sw.js').then(function(sw) {
		if(!navigator.serviceWorker.controller) return;

		if(sw.waiting){
			sw.postMessage('message', {action: 'skipWaiting'});
			return;
		}

		if(sw.installing){
			trackInstalling(sw.installing);
		}

		sw.addEventListener('updatefound', function (){
			trackInstalling(sw.installing);
		});
	});
}

function trackInstalling(worker) {
	worker.addEventListener('statechange', function(){
		if(worker.state == 'installed'){
			updateIsReady(worker);
		}
	});
}

function updateIsReady(sw){
	pushUpdateFound();
}

function pushUpdateFound() {
	$(".show").fadeIn();
  	console.log('sw cant find update');
}



// indexdb 
if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB");
}

function openDatabase(){
	const DB_NAME 	= 'CurrencyXchange';
	const database 	= indexedDB.open(DB_NAME, 1);

	database.onerror = (event) => {
		console.log('an error occur when opening db');
		return false;
	};

	
	database.onupgradeneeded = function(event) {
	  	var upgradeDB = event.target.result;
	  	var objectStore = upgradeDB.createObjectStore("currencies");
	};
	return database;
}
function saveToDatabase(data){
	const db = openDatabase();
	
	db.onsuccess = (event) => {
		const query = event.target.result;
		const currency = query.transaction("currencies").objectStore("currencies").get(data.symbol);

	  	currency.onsuccess = (event) => {
	  		const dbData = event.target.result;
	  		const store  = query.transaction("currencies", "readwrite").objectStore("currencies");

	  		if(!dbData){ 
				store.add(data, data.symbol);
	  		}else{
				store.put(data, data.symbol);
	  		};
	  	}
	}
}

function fetchFromDatabase(symbol, amount) {
	const db = openDatabase();
	db.onsuccess = (event) => {

		const query = event.target.result;
		const currency = query.transaction("currencies").objectStore("currencies").get(symbol);
	  	currency.onsuccess = (event) => {
	  		const data = event.target.result;
	  		if(data == null){
	  			$(".er_msg").append(`
					<div class="row">
		                <button class="btn btn-danger">
		                	No network you are offline 
		                </button>
					</div>
				`);
				setTimeout((e) => {
					$(".er_msg").html("");
				}, 2000);
				return false;
	  		}
	  	}
	}
}

//fetch api

function loadCurrency(){
    var from = document.getElementById('from')
    var to = document.getElementById('to')
    var xHttp = new XMLHttpRequest()
    xHttp.onreadystatechange = function(){
        if(xHttp.readyState==4 && xHttp.status==200){
            var obj = JSON.parse(this.responseText);
            var options = ''
            for(key in obj.results){
                currenyName = obj.results[key].currencyName
                options = options+'<option>'+key+'  ( '+currenyName+' )'+'</option>'
               // options = options+'<option>'+key+'</option>'
                //console.log(currenyName);
            }
            from.innerHTML=options
            to.innerHTML=options
        }
    }
    xHttp.open('GET', 'https://free.currencyconverterapi.com/api/v5/currencies', true)
    xHttp.send();
}

// convert the currency

function convertCurrency(){
    var from = document.getElementById('from').value
    var to = document.getElementById('to').value
    var amount = document.getElementById('amount').value
    var result = document.getElementById('result')
    var symbol = document.getElementById('symbol')
    dif_from = from.slice(0,3)
    dif_to = to.slice(0,3)
    
    var use1 = dif_from+'_'+dif_to;
    var use = from+'_'+to
    console.log(use);  
    if(from.length >0 && to.length >0 && amount.length>0  ){
        var xHttp = new XMLHttpRequest()
        xHttp.onreadystatechange = function(){
            if(xHttp.readyState==4 && xHttp.status==200){
                var obj = JSON.parse(this.responseText);
                var fact = obj.results[use1];  
                
                console.log(fact);
                fact = fact.val
                 //console.log(fact)
                // console.log(use);
                if(fact!=undefined){
                    result.innerHTML = parseFloat(amount)*parseFloat(fact);
                    symbol.innerHTML = dif_to
                }
                let object = {
                    symbol: use,
                    value: fact
                };
                saveToDatabase(object);
            }else{
                fetchFromDatabase(use, amount);
            }
            return false;
        }
        xHttp.open('GET', 'https://free.currencyconverterapi.com/api/v5/convert?q='+dif_from+'_'+dif_to, true)
        xHttp.send();
    }
}

// refresh page
function refreshPage() {
	window.location.reload();
}
