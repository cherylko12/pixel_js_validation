(function() {
    'use strict';

    // set history storage key
    const HISTORY_STORAGE_KEY = 'bwVisistHistory';
    const BROWSER_STORAGE_KEY = 'bwBrowserState' + location.pathname;

    var wrapper = document.createElement('div');
    
    // create validation area
    var elem = document.createElement('div');
    elem.setAttribute("id", "pixel-validation");
    elem.setAttribute("style", "position: fixed; bottom:0; right:0; z-index: 999; display: block; background-color: white; border: 1px solid rgba(0,0,0, 0.5); border-radius:10px 0 0 0; padding: 10px; text-align: left; max-height: 50%; overflow: auto;");
    
    var button = document.createElement('button');
    button.setAttribute("id", "pixel-show");
    button.setAttribute("style", "position: fixed;right: 0px;z-index: 999; bottom: 50%; background: rgba(0, 0, 0, 0); border: 0px; padding: 3px; border-radius: 20px; font-size: 20px;");
    button.textContent = "🔧";

    wrapper.appendChild(elem);
    wrapper.appendChild(button);

    var bodyHtml = document.getElementsByTagName('body');
    bodyHtml[0].prepend(wrapper);

    // get pixel validation area element
    var pixelValidationElem = document.getElementById('pixel-validation');
    var cookieId = getCookie('__BWfp');

    pixelValidationElem.innerHTML += `<div id ="bw-cookie">1st cookie: ${cookieId}</div>`;

    setTimeout(function(){
        if(window.bw){
            appendSessionIdAndEngagementTime();
            setValueChecker();
            appendHistoryTable();
            refreshHistoryTable();
            updateBrowserDisplayedState();
            document.getElementById('bw-eventHistoryBtn').addEventListener('click', () => {
                let table = document.getElementById('bw-eventHistoryTable');
                table.style.display = !table.style.display | table.style.display === 'none' ? 'table' : 'none';
            });
        
            document.getElementById('bw-clearEventHistoryBtn').addEventListener('click', () => {
                window.localStorage.removeItem(HISTORY_STORAGE_KEY);
                refreshHistoryTable();
            });

            document.getElementById('pixel-show').addEventListener('click', () => {
                let block = document.getElementById('pixel-validation');
                block.style.display = !block.style.display | block.style.display === 'none' ? 'block' : 'none';
            });

            document.getElementById('bw-browserEventBtn').addEventListener('click', () => {
                let eventTable = document.getElementById('bw-eventHistoryTable');
                eventTable.style.display = 'none';
                let browserTable = document.getElementById('bw-browserEventHistoryTable');
                browserTable.style.display = !browserTable.style.display | browserTable.style.display === 'none' ? 'table' : 'none';
            });

            document.getElementById('bw-browserEventClear').addEventListener('click', () => {
                window.localStorage.removeItem(BROWSER_STORAGE_KEY);
                updateBrowserDisplayedState();
            });

            document.getElementById('bw-updateBrowserEvent').addEventListener('click', () => {
                updateBrowserDisplayedState();
            });
        }
    }, 3000);

    function appendHistoryTable(){
        const styleTag = document.createElement('style');
        styleTag.textContent = `
            .bw-log-table {
                width: 100%;
                border-collapse: collapse;
                display: none;
                font-size: 10px;
            }
        
            .bw-log-table th, .bw-log-table td {
                padding: 2px;
                border: 1px solid #dddddd;
                text-align: left;
                max-width:300px;
                word-break: break-word;
            }
        
            .bwv-btn {
                background-color: #ffffff;
                border: 2px solid #6c757d;
                border-radius: 5px;
                padding: 3px;
                margin-top: 10px;
                margin-bottom: 10px;
                margin-right: 10px;
                cursor: pointer;
                font-size: 12px;
            }
        `;
        document.head.appendChild(styleTag);
        pixelValidationElem.innerHTML += `<button id="bw-eventHistoryBtn" class="bwv-btn">Show Eng. Hist.</button>`;
        pixelValidationElem.innerHTML += `<button id="bw-clearEventHistoryBtn" class="bwv-btn">Clear Eng. Hist.</button>`;
        pixelValidationElem.innerHTML += `<button id="bw-browserEventBtn" class="bwv-btn">Show Browser Hist.</button>`;
        pixelValidationElem.innerHTML += `<button id="bw-browserEventClear" class="bwv-btn">Clear Browser Hist.</button>`;
        pixelValidationElem.innerHTML += `<button id="bw-updateBrowserEvent" class="bwv-btn">Update Browser Hist.</button>`;
        pixelValidationElem.innerHTML += `
            <table class="bw-log-table" id="bw-eventHistoryTable">
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Session ID</th>
                        <th>Eng. Time</th>
                    </tr>
                </thead>
                <tbody id="bw-eventHistoryTableBody">
                </tbody>
            </table>
        `;

        pixelValidationElem.innerHTML += `
            <table class="bw-log-table" id="bw-browserEventHistoryTable">
                <thead>
                    <tr>
                        <th>Event</th>
                        <th>target</th>
                        <th>document.hidden</th>
                        <th>document.focus</th>
                        <th>Time</th>
                        <th>Session</th>
                    </tr>
                </thead>
                <tbody id="bw-browserEventHistoryTableBody">
                </tbody>
            </table>
        `;
    }

    function refreshHistoryTable(){
        var history = getStoredEventHistory(HISTORY_STORAGE_KEY);
        const logBody = document.getElementById('bw-eventHistoryTableBody');
        logBody.innerHTML = '';
        history.forEach((log) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${decodeURIComponent(log['browser[url]'])}</td>
                <td>${log['sid']}</td>
                <td>${log['egt']}</td>
            `;
            logBody.appendChild(row);
        });
    }

    function appendSessionIdAndEngagementTime(){
        var ready = false;
        while(!ready){
            ready = !!(window.bw?.pixelIds && Object.keys(window.bw.pixelIds).length >= 1);
            if(ready){
                Object.keys(window.bw.pixelIds).forEach(id => {
                    pixelValidationElem.innerHTML += `<div id ="pxiel-${id}">pixel id: ${id} @ ${window._bw.version}`+
                        `<div class='session-id'></div>`+
                        `<div class="engagement-time"></div></div>`;
                    document.getElementById(`pxiel-${id}`).getElementsByClassName('session-id')[0].innerHTML = `Session: ${getFirstPartyLocalStorageItem(`__BW_${id}`)}`;
                });
            }
        }
    }

    function setValueChecker(){
        // set Interval
        setInterval(function (){
            Object.keys(window.bw.pixelIds).forEach(id => {
                var temp = document.getElementById(`pxiel-${id}`).getElementsByClassName('engagement-time')[0];
                temp.innerHTML = `<div>Engagement Time: ${Math.floor(window.bw.engagementTracker[id].getCurrentEngagementTime() / 1000)}</div>`;
            });
        }, 1);

        // set Interval
        setInterval(function (){
            Object.keys(window.bw.pixelIds).forEach(id => {
                var newSessionId = `Session: ${getFirstPartyLocalStorageItem(`__BW_${id}`)}`
                var sessionElem = document.getElementById(`pxiel-${id}`).getElementsByClassName('session-id')[0]
                var innerHtml = sessionElem.innerHTML;
                if(innerHtml != newSessionId){
                    sessionElem.innerHTML = newSessionId;
                }
            })
        }, 1000);
    }

    // 覆寫sendBeacon, 攔截請求
    const originalSendBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function(url, data) {
        if(url.includes('pixel-api.scupio.com')){
            let history =  getStoredEventHistory(HISTORY_STORAGE_KEY);
            let keys = ['browser[url]', 'sid', 'egt'];
            let dict = {}
            for (let pair of data.entries()) {
                let [key, value] = pair;
                if (keys.includes(key)) {
                    dict[key] = value;
                }
            }
            history.push(dict);
            saveStoredEventHistory(HISTORY_STORAGE_KEY, history);
        }

        // 原始navigator
        return originalSendBeacon.apply(navigator, arguments);
    };

    function saveStoredEventHistory(key, logs) {
        window.localStorage.setItem(key, JSON.stringify(logs));
    };

    function getStoredEventHistory(key) {
        var history;
        try {
            history= JSON.parse(getFirstPartyLocalStorageItem(key));
        } catch (err) {
            // Do nothing.
            console.log(err);
        }
        return history || [];
    };

    // utils function
    function getCookie(key) {
        var result = '',
            cookieList,
            cookieValue,
            i;

        // get cookie id first
        try {
            key = decodeURIComponent(key);
            cookieList = document.cookie.split(';');
            i = cookieList.length - 1;
            while (i >= 0) {
                cookieValue = cookieList[i].trim();
                if (cookieValue.indexOf(key) === 0) {
                    result = cookieValue.substring(key.length + 1, cookieValue.length);
                }
                i -= 1;
            }
            result = decodeURIComponent(result);
        } catch (ignore) {
            // ignore
        }

        return result;
    }

    var localStorageAvailable = (typeof localStorage === 'object' && localStorage !== null && typeof localStorage.getItem === 'function' && typeof localStorage.setItem === 'function');
    function getFirstPartyLocalStorageItem(keyName) {
        var keyValue = '';
        try {
            if (localStorageAvailable) {
                // keyValue would be null if keyName doesn't exist
                keyValue = window.localStorage.getItem(keyName) || '';
            }
        } catch (ignore) {
            // ignore exception
            console.log("can not get");
        }
        return keyValue;
    }

    function appendStoredState(event, target, visibilityState, focus, date, session) {
        var stateHistory = getStoredEventHistory(BROWSER_STORAGE_KEY);
        stateHistory.push({event: event, target: target, visibilityState: visibilityState, focus: focus, date: date, session: session});
        saveStoredEventHistory(BROWSER_STORAGE_KEY, stateHistory);
        updateBrowserDisplayedState();
    };
      
    function updateBrowserDisplayedState() {
        var addRow = function(entry) {
            var tr = document.createElement('tr');
            var td1 = document.createElement('td');
            var td2 = document.createElement('td');
            var td3 = document.createElement('td');
            var td4 = document.createElement('td');
            var td5 = document.createElement('td');
            var td6 = document.createElement('td');
            td1.innerText = entry.event;
            td2.innerText = entry.target;
            td3.innerText = entry.visibilityState;
            td4.innerText = entry.focus;
            td5.innerText = entry.date;
            td6.innerText = entry.session;
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            tr.appendChild(td5);
            tr.appendChild(td6);
            tbody.appendChild(tr);
        };
        var removeRow = function(row) {
            row.parentNode.removeChild(row);
        };
        
        var tbody = document.getElementById('bw-browserEventHistoryTableBody');
        var entries = getStoredEventHistory(BROWSER_STORAGE_KEY);
        var rows = [].slice.call(tbody.children);
        var min = Math.min(entries.length, rows.length);
        var max = Math.max(entries.length, rows.length);
        
        for (var i = min; i < max; i++) {
            if (i >= rows.length) {
            addRow(entries[i]);
            } else {
            removeRow(rows[i]);
            }
        }
    };

    function trackEvent(event) {
        const target = (event.target === window ? '#window' : event.target.nodeName).toLowerCase();
        var sessions = [];
        Object.keys(window.bw.pixelIds).forEach(id => {
            sessions.push(getFirstPartyLocalStorageItem(`__BW_${id}`));
        });
        appendStoredState(event.type, target, document.hidden, document.hasFocus(), new Date().toISOString(), sessions.join(','));
    }
    
    window.addEventListener('focus', trackEvent, false);
    window.addEventListener('blur', trackEvent, false);
    document.addEventListener('visibilitychange', trackEvent, false);
    document.window.addEventListener('pagehide', trackEvent, false);
    window.addEventListener('pageshow', trackEvent, false);
    window.addEventListener('freeze', trackEvent, false);
    window.addEventListener('resume', trackEvent, false);
})();
