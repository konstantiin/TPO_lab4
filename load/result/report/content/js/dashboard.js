/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 79.72222222222223, "KoPercent": 20.27777777777778};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.5625, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.9916666666666667, 500, 1500, "Config #3 request"], "isController": false}, {"data": [0.5, 500, 1500, "Config #2 request"], "isController": false}, {"data": [0.19583333333333333, 500, 1500, "Config #1 request"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 720, 146, 20.27777777777778, 587.1138888888887, 319, 903, 574.0, 800.9, 830.8999999999999, 866.0, 9.083798036890313, 2.049177096212561, 0.0], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Config #3 request", 240, 0, 0.0, 383.9666666666666, 319, 563, 372.0, 437.0, 477.5999999999999, 556.85, 3.046226486939304, 0.6871858578935344, 0.0], "isController": false}, {"data": ["Config #2 request", 240, 0, 0.0, 589.6583333333334, 524, 770, 574.0, 649.7, 678.3999999999999, 765.9000000000001, 3.038513154229863, 0.6854458385030258, 0.0], "isController": false}, {"data": ["Config #1 request", 240, 146, 60.833333333333336, 787.7166666666664, 722, 903, 781.5, 842.5, 854.9, 895.6200000000001, 3.0279326789634378, 0.6830590320708536, 0.0], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["The operation lasted too long: It took 790 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 775 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 805 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 810 milliseconds, but should not have lasted longer than 770 milliseconds.", 4, 2.73972602739726, 0.5555555555555556], "isController": false}, {"data": ["The operation lasted too long: It took 786 milliseconds, but should not have lasted longer than 770 milliseconds.", 4, 2.73972602739726, 0.5555555555555556], "isController": false}, {"data": ["The operation lasted too long: It took 903 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 858 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 831 milliseconds, but should not have lasted longer than 770 milliseconds.", 4, 2.73972602739726, 0.5555555555555556], "isController": false}, {"data": ["The operation lasted too long: It took 847 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 780 milliseconds, but should not have lasted longer than 770 milliseconds.", 4, 2.73972602739726, 0.5555555555555556], "isController": false}, {"data": ["The operation lasted too long: It took 836 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 867 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 781 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 774 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 777 milliseconds, but should not have lasted longer than 770 milliseconds.", 4, 2.73972602739726, 0.5555555555555556], "isController": false}, {"data": ["The operation lasted too long: It took 797 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 771 milliseconds, but should not have lasted longer than 770 milliseconds.", 4, 2.73972602739726, 0.5555555555555556], "isController": false}, {"data": ["The operation lasted too long: It took 806 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 838 milliseconds, but should not have lasted longer than 770 milliseconds.", 4, 2.73972602739726, 0.5555555555555556], "isController": false}, {"data": ["The operation lasted too long: It took 832 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 787 milliseconds, but should not have lasted longer than 770 milliseconds.", 4, 2.73972602739726, 0.5555555555555556], "isController": false}, {"data": ["The operation lasted too long: It took 800 milliseconds, but should not have lasted longer than 770 milliseconds.", 8, 5.47945205479452, 1.1111111111111112], "isController": false}, {"data": ["The operation lasted too long: It took 855 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 793 milliseconds, but should not have lasted longer than 770 milliseconds.", 6, 4.109589041095891, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 819 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 813 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 778 milliseconds, but should not have lasted longer than 770 milliseconds.", 4, 2.73972602739726, 0.5555555555555556], "isController": false}, {"data": ["The operation lasted too long: It took 823 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 782 milliseconds, but should not have lasted longer than 770 milliseconds.", 6, 4.109589041095891, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 783 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 789 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 829 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 812 milliseconds, but should not have lasted longer than 770 milliseconds.", 4, 2.73972602739726, 0.5555555555555556], "isController": false}, {"data": ["The operation lasted too long: It took 788 milliseconds, but should not have lasted longer than 770 milliseconds.", 6, 4.109589041095891, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 818 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 799 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 807 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 885 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 849 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 811 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 801 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 814 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 798 milliseconds, but should not have lasted longer than 770 milliseconds.", 4, 2.73972602739726, 0.5555555555555556], "isController": false}, {"data": ["The operation lasted too long: It took 843 milliseconds, but should not have lasted longer than 770 milliseconds.", 4, 2.73972602739726, 0.5555555555555556], "isController": false}, {"data": ["The operation lasted too long: It took 817 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 779 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 821 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 773 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 866 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 853 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 850 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}, {"data": ["The operation lasted too long: It took 824 milliseconds, but should not have lasted longer than 770 milliseconds.", 2, 1.36986301369863, 0.2777777777777778], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 720, 146, "The operation lasted too long: It took 800 milliseconds, but should not have lasted longer than 770 milliseconds.", 8, "The operation lasted too long: It took 793 milliseconds, but should not have lasted longer than 770 milliseconds.", 6, "The operation lasted too long: It took 782 milliseconds, but should not have lasted longer than 770 milliseconds.", 6, "The operation lasted too long: It took 788 milliseconds, but should not have lasted longer than 770 milliseconds.", 6, "The operation lasted too long: It took 810 milliseconds, but should not have lasted longer than 770 milliseconds.", 4], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Config #1 request", 240, 146, "The operation lasted too long: It took 800 milliseconds, but should not have lasted longer than 770 milliseconds.", 8, "The operation lasted too long: It took 793 milliseconds, but should not have lasted longer than 770 milliseconds.", 6, "The operation lasted too long: It took 782 milliseconds, but should not have lasted longer than 770 milliseconds.", 6, "The operation lasted too long: It took 788 milliseconds, but should not have lasted longer than 770 milliseconds.", 6, "The operation lasted too long: It took 810 milliseconds, but should not have lasted longer than 770 milliseconds.", 4], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
