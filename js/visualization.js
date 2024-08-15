class MiscUtil {
    static getURI() {
        var url = window.location.href;
        var ind = url.lastIndexOf("/");
        return url.substring(0, ind);
    }

    static getRandId(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    }

    static randIntFromInterval(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    static parseDate(dateStr) {
        dateStr = `${dateStr}`; // handle date passed as integer

        if (dateStr.match(/^[0-9]+$/) != null) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            const hr = dateStr.substring(8, 10);
            const min = dateStr.substring(10, 12);

            const date = new Date(year, month - 1, day, hr, min);
            return { str: `${year}-${month}-${day} ${hr}:${min}`, date };
        }

        return null;
    }

    static padNum(number, length, char = '0') {
        var numStr = `${number}`;
        while (numStr.length < length) { numStr = `0${numStr}`; }
        return numStr;
    }

    static fetchJson(url, params) {
        return new Promise(async (resolve, reject) => {
            try {
                let fetchOpts = undefined;
                if (typeof params !== 'undefined') {
                    // assume this is a post request
                    fetchOpts = {
                        method: 'POST',
                        headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
                        body: params
                    }
                }

                const req = await fetch(url, fetchOpts);
                if (!req.ok) {
                    reject(new Error('Failed to fetch JSON'))
                } else {
                    const resp = await req.json();
                    resolve(resp);
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    static parseWKTString(wktString) {
        const shapeTypeRe = /^\w+/gi;
        const coordSetsRe = /\([-?\d., ]+\)/gi;

        const shapeTypeMatches = wktString.match(shapeTypeRe);
        if (shapeTypeMatches.length) {
            const shape = shapeTypeMatches[0].toLowerCase();
            if (shape === 'polygon') {
                const coordSetsMatches = wktString.match(coordSetsRe);
                if (coordSetsMatches) {
                    // no support for inner-cutouts
                    const coordString = coordSetsMatches[0];
                    const coordPieces = coordString.replace('(', '').replace(')', '').split(',');
                    const coords = coordPieces.map((cStr) => {
                        return cStr
                            .trim()
                            .split(' ')
                            .map((x) => parseFloat(x));
                    });
                    return {
                        shape,
                        coords,
                    };
                } else {
                    console.warn('WARN: could not parse coordinates from WKT string');
                    return false;
                }
            } else {
                console.warn('WARN: unsupported WKT shape type');
                return false;
            }
        } else {
            console.warn('WARN: could not parse shape from WKT string');
            return false;
        }
    }
}

class DataCache {
    constructor(max = 100) {
        this._keyArr = [];
        this._cache = {};
        this._max = max;
    }

    get(key) {
        const item = this._cache[key];

        // move item to the front of the cache
        if (item) {
            const kInd = this._keyArr.indexOf(key);
            this._keyArr.splice(kInd, 1);
            this._keyArr.unshift(key);
        }

        return item
    }

    add(key, item) {
        // add item to the cache
        this._cache[key] = item;
        this._keyArr.unshift(key);

        this.prune();

        return key;
    }

    prune() {
        while (this._keyArr.length > this._max) {
            const delKey = this._keyArr[this._keyArr.length - 1];
            this._cache[delKey] = undefined;
            delete this._cache[delKey];
            this._keyArr.splice(this._keyArr.length - 1, 1);
        }
    }
}

class DataUtil {
    constructor() {
        this._datastore = new DataCache(50);
    }

    async getData(options) {
        // TODO - build actual query from options
        const url = "http://localhost:8100/getData?files=90-Interpolated-Data.nc,127-Interpolated-Data.nc";

        let data = this._datastore.get(url);

        if (!data) {
            try {
                data = await fetch(url).then((res) => {
                    if (res.status >= 400) {
                        throw new Error('failed to fetch');
                    }
                    return res.json();
                });
                this._datastore.add(url, data);
            } catch (err) {
                console.log(err);
                return null
            }
        }

        console.log(data);
        return data;
    }

    getRandData(options) {
        const {
            count,
            dim,
            series,
        } = options;

        const singleSeries = (min = 0, max = 100) => {
            const data = [];
            for (let i = 0; i < count; ++i) {
                const entry = [];
                for (let j = 0; j < dim; ++j) {
                    entry.push(MiscUtil.randIntFromInterval(min, max));
                }
                data.push(entry);
            }
            return data;
        }

        let data;
        if (series > 1) {
            data = [];
            for (let i = 0; i < series; ++i) {
                data.push(singleSeries(0, (i + 1) * 100));
            }
        } else {
            data = singleSeries();
        }

        return data;
    }
}

class JobUtil {
    constructor() {
        this.resetJobTracker();
        this._datatable = this.initDatatable();
    }

    initDatatable() {
        // initialize the table
        const dataTable = new DataTable(`#vis_anom_summary_list`, {
            paging: false,
            searching: false,
            scrollCollapse: true,
            scrollY: '340px',
            fixedColumns: true,
            columns: [
                { data: 'anomalyId', className: "text-left" },
                { data: 'startDate', className: "text-center" },
                { data: 'endDate', className: "text-center" }
            ],
            columnDefs: [
                // Center align both header and body content of columns 1, 2 & 3
                { className: "dt-head-center", targets: [0, 1, 2] },
                { width: "40%", targets: [1, 2] }
            ],
            data: []
        });

        // enable multiple selection
        dataTable.on('click', 'tbody tr', (e) => {
            e.currentTarget.classList.toggle('selected');
        });

        return dataTable;
    }

    resetJobTracker() {
        this._currJob = {
            id: undefined,
            fileList: [],
            anomList: [],
            jobSumm: undefined
        };
    }

    async fetchJob(jobId) {
        this.clearCurrentJob();

        console.log(`fetching: ${jobId}`);
        const appRoot = MiscUtil.getURI();

        // fetch list of associated files to test for job completion/existence
        let url = `${appRoot}/GetAllFileByJobID.php?jobID=${jobId}`;
        let req = await fetch(url);
        const fileListStr = await req.text();
        console.log(`file list: ${fileListStr}`);
        if (fileListStr.length > 0) {

            // split out file names
            const fileList = fileListStr.split(';');
            fileList.sort();

            // find TOC file
            const reg = /-ForTraCC-TOC/ig
            const toc_file = fileList.find(fname => {
                return !!(fname.match(reg));
            });

            // fetch all the job data
            const promArr = [];
            promArr.push(MiscUtil.fetchJson(`${appRoot}/GetJob.php?jobID=${jobId}`))
            promArr.push(MiscUtil.fetchJson(`${appRoot}/GetJsonByKey.php?key=${toc_file}`))
            promArr.push(MiscUtil.fetchJson(`${appRoot}/api/location?jobID=${jobId}`))

            // prepare to populate the page with the responses
            Promise.all(promArr).then(([jobSumm, anomList, interpFiles]) => {
                console.log(jobSumm, anomList, interpFiles);

                this._currJob = {
                    id: jobId,
                    fileList: fileList,
                    anomList: anomList,
                    jobSumm: jobSumm
                }

                this.populateJobSummary(jobId, jobSumm);
                this.populateChartForms(anomList, interpFiles);
            }).catch(err => {
                console.warn(err);
                this.clearAndShowError();
            })
        } else {
            this.clearAndShowError();
        }
    }

    clearCurrentJob() {
        this.resetJobTracker();
        $("#job_summ_data").remove();
    }

    clearAndShowError(err = 'Job Not Found') {
        this.clearCurrentJob();

        const errorNodeStr = `
            <div id="job_summ_data" class="vis_job-error">
                ${err}
            </div>
        `;

        $("#job_summary_wrapper").append(errorNodeStr);
    }

    populateJobSummary(jobId, jobSumm) {

        const {
            coords,
            dataset,
            startDate,
            endDate,
            variable,
            ineqOperator,
            ineqValue,
            phdefJobID,
            email,
            firstName,
            lastName,
            description,
        } = jobSumm;

        let eqSym = '=';
        if (ineqOperator == "lessThanOrEqualTo") {
            eqSym = '≤'
        } else if (ineqOperator == "greaterThanOrEqualTo") {
            eqSym = '≥'
        } else if (ineqOperator == "lessThan") {
            eqSym = '<'
        } else if (ineqOperator == "greaterThan") {
            eqSym = '>'
        } else if (ineqOperator == "standardDeviation") {
            eqSym = 'σ'
        }

        const summNodeStr = `
            <div id="job_summ_data" class="vis_job-summ-wrapper">
                <div class="vis_job-title">Summary</div>
                <div class="vis_job-summ-content">
                    <div class="vis_job-summ-entry">
                        <div class="vis_job-summ-label">Job Id</div>
                        <div class="vis_job-summ-value">${jobId}</div>
                    </div>
                    <div class="vis_job-summ-entry">
                        <div class="vis_job-summ-label">Description</div>
                        <div class="vis_job-summ-value">${description || 'Not Available'}</div>
                    </div>
                    <div class="vis_job-summ-entry">
                        <div class="vis_job-summ-label">Dataset</div>
                        <div class="vis_job-summ-value">${dataset}</div>
                    </div>
                    <div class="vis_job-summ-entry">
                        <div class="vis_job-summ-label">Value Search</div>
                        <div class="vis_job-summ-value">${variable} ${eqSym} ${ineqValue}</div>
                    </div>
                    <div class="vis_job-summ-entry">
                        <div class="vis_job-summ-label">Start Date</div>
                        <div class="vis_job-summ-value">${startDate}</div>
                    </div>
                    <div class="vis_job-summ-entry">
                        <div class="vis_job-summ-label">End Date</div>
                        <div class="vis_job-summ-value">${endDate}</div>
                    </div>
                </div>
            </div>
        `;

        $("#job_summary_wrapper").append(summNodeStr);

        // add bbox to map
        const bounds = MiscUtil.parseWKTString(coords);
        _glob_mapUtil.addPoly({ coords: bounds.coords })
    }

    populateChartForms(anomSumm, interpFiles) {
        // format data for the table
        const tableData = anomSumm.map((anom) => {
            const { name, start_date, end_date } = anom;

            const anomalyId = name.match(/\d+/ig)[0]
            const startDate = MiscUtil.parseDate(start_date).str;
            const endDate = MiscUtil.parseDate(end_date).str;
            return { anomalyId, startDate, endDate };
        });

        // populate data table
        this._datatable.clear();
        this._datatable.rows.add(tableData);
        this._datatable.draw();


        // populate variable selectors
        const varOptions = interpFiles.map(ent => {
            return `<option value="${ent.location}">${ent.variable}</option>`
        });

        $("#chart_variable_select_1").append(varOptions.join(''));
        $("#chart_variable_select_2").append(varOptions.join(''));
        $("#chart_variable_select_3").append([
            `<option value="">None</option>`
        ].concat(varOptions).join(''));

    }

}

class ChartUtil {
    constructor() {
        this._dataUtil = new DataUtil();

        this._chartStore = {};

        this._stdFormatter = Intl.NumberFormat("en", {
            notation: "compact"
        });

        window.addEventListener('resize', function () {
            for (const chartId in this._chartStore) {
                const { chart } = this._chartStore[chartId];
                chart.resize();
            }
        });
    }

    async initChart(options) {
        // TODO - I think this is what we're really aiming for
        // https://echarts.apache.org/examples/en/editor.html?c=scatter-matrix

        const chartNodeIdSet = this.createChartNode();
        const { chartId, chartNodeId } = chartNodeIdSet;
        const node = $(`#${chartNodeId}`).get(0);

        // init chart
        const chart = echarts.init(node, "light", {
            renderer: 'canvas'
        });
        chart.showLoading();

        // fetch data
        const plotData = await this._dataUtil.getData({});
        if (!plotData) {
            console.log("Failed to fetch data");
            return;
        }

        // build chart
        const chart_opts = {
            animation: false,
            title: {
                text: plotData['title'] || "Sample Chart",
                subtext: `${plotData.values.length} Points`
            },
            grid: {
                right: '8px'
            },
            // legend: {
            //   show: true,
            //   orient: 'horizontal',
            //   bottom: 0,
            //   type: 'plain'
            // },
            tooltip: {
                // showContent: false,
                transitionDuration: 0,
                axisPointer: {
                    type: 'cross',
                },
                formatter: (parms, ticket, cb) => {
                    const {
                        color,
                        value,
                        dimensionNames: labels
                    } = parms;

                    const [xlabel, ylabel] = labels;
                    const [x, y, lat, lon, time, id] = value;

                    return `
                        <div style="display: flex; flex-flow: row nowrap;">
                        <div style="flex-basis 20px; width: 20px; padding: 4px;">
                            <div style="display: block; border-radius: 50%; width: 10px; height: 10px; background: ${color}"></div>
                        </div>
                        <div style="display: flex; flex-flow: column; flex: 1 1;">
                        <div style="display: flex; flex-flow: row nowrap; flex: 1 1">
                            <div style="flex: 1 1; font-weight: bold;">${xlabel}</div>
                            <div style="flex: 1 1; font-family: monospace; text-align: right; padding-left: 8px;">${x.toFixed(5)}</div>
                            </div>
                            <div style="display: flex; flex-flow: row nowrap; flex: 1 1">
                            <div style="flex: 1 1; font-weight: bold;">${ylabel}</div>
                            <div style="flex: 1 1; font-family: monospace; text-align: right; padding-left: 8px;">${y.toFixed(5)}</div>
                            </div>
                            <div style="display: flex; flex-flow: row nowrap; flex: 1 1">
                            <div style="flex: 1 1; font-weight: bold;">Anomaly</div>
                            <div style="flex: 1 1; font-family: monospace; text-align: right; padding-left: 8px;">${id}</div>
                            </div>
                            <div style="display: flex; flex-flow: row nowrap; flex: 1 1">
                            <div style="flex: 1 1; font-weight: bold;">Time</div>
                            <div style="flex: 1 1; font-family: monospace; text-align: right; padding-left: 8px;">${MiscUtil.parseDate(time).str}</div>
                            </div>
                        </div>
                        </div>
                    `;
                }
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        brushStyle: {
                            color: 'rgba(230, 230, 230, 0.75)',
                            borderColor: 'rgba(0, 0, 0, 1)',
                            borderWidth: 1,
                            borderType: 'dashed'
                        }
                    },
                    saveAsImage: {},
                }
            },
            xAxis: [{
                name: plotData.axis_labels[0],
                nameLocation: 'center',
                position: 'bottom',
                nameGap: 25,
                axisLabel: {
                    formatter: this._stdFormatter.format
                }
            }],
            yAxis: plotData.axis_labels.slice(1, plotData.axis_labels.length).map((label, i) => {
                return {
                    name: label,
                    nameLocation: 'center',
                    nameGap: 40,
                    position: i % 2 ? 'right' : 'left',
                    offset: i % 2 ? ((i - 1) / 2) * 50 : (i / 2) * 50,
                    axisLabel: {
                        formatter: this._stdFormatter.format
                    }
                };
            }),
            dataset: {
                source: plotData.values,
                dimensions: plotData.axis_labels.map(x => {
                    return {
                        name: x,
                        type: 'float'
                    }
                })
            },
            series: {
                type: 'scatter',
                symbolSize: 5,
                blendMode: 'source-over',
                large: true,
                largeThreshold: 500
            }
        };
        chart.hideLoading();
        chart.setOption(chart_opts);

        // store chart for later reference
        this._chartStore[chartId] = { chart, fullData: plotData, idSet: chartNodeIdSet };

        // init the table with anomaly data
        this.initChartControls(chartNodeIdSet);

        return true;
    }

    initChartControls(chartIdSet) {
        const { chartId, chartTableId, chartSelectStartDateId, chartSelectEndDateId } = chartIdSet;
        const { fullData } = this._chartStore[chartId];

        // collect all the anomaly ids and their date ranges
        let minDate = Number.POSITIVE_INFINITY;
        let maxDate = Number.NEGATIVE_INFINITY;
        const anomalyMetadata = fullData.values.reduce((acc, ent) => {
            const [x, y, lat, lon, date, anomalyId] = ent;

            // update anomaly info
            if (acc[anomalyId]) {
                acc[anomalyId].startDate = Math.min(acc[anomalyId].startDate, date)
                acc[anomalyId].endDate = Math.max(acc[anomalyId].endDate, date)
            } else {
                acc[anomalyId] = {
                    anomalyId,
                    startDate: date,
                    endDate: date,
                }
            }

            // update date bounds tracking
            minDate = Math.min(minDate, date);
            maxDate = Math.max(maxDate, date);

            return acc;
        }, {});

        // format data for the table
        const tableData = Object.keys(anomalyMetadata).sort().map((id) => {
            anomalyMetadata[id].startDate = MiscUtil.parseDate(anomalyMetadata[id].startDate).str;
            anomalyMetadata[id].endDate = MiscUtil.parseDate(anomalyMetadata[id].endDate).str;
            return anomalyMetadata[id];
        });

        // initialize the table
        const dataTable = new DataTable(`#${chartTableId}`, {
            paging: false,
            searching: false,
            scrollCollapse: true,
            scrollY: '450px',
            fixedColumns: true,
            columns: [
                { data: 'anomalyId', className: "text-left" },
                { data: 'startDate', className: "text-center" },
                { data: 'endDate', className: "text-center" }
            ],
            columnDefs: [
                // Center align both header and body content of columns 1, 2 & 3
                { className: "dt-head-center", targets: [0, 1, 2] },
                { width: "40%", targets: [1, 2] }
            ],
            data: tableData
        });

        // enable multiple selection
        dataTable.on('click', 'tbody tr', (e) => {
            e.currentTarget.classList.toggle('selected');
        });

        // init date selectors
        minDate = MiscUtil.parseDate(minDate).date;
        maxDate = MiscUtil.parseDate(maxDate).date;
        $(`#${chartSelectStartDateId}`).flatpickr({
            enableTime: true,
            time_24hr: true,
            dateFormat: "Y-m-d H:i",
            defaultDate: minDate,
            minuteIncrement: 15,
            minDate,
            maxDate
        });
        $(`#${chartSelectEndDateId}`).flatpickr({
            enableTime: true,
            time_24hr: true,
            dateFormat: "Y-m-d H:i",
            defaultDate: maxDate,
            minuteIncrement: 15,
            minDate,
            maxDate
        });

        // store data table for future use
        this._chartStore[chartId].dataTable = dataTable;
        this._chartStore[chartId].minDate = minDate;
        this._chartStore[chartId].maxDate = maxDate;
    }

    clearAllAnomalies(chartId) {
        const { dataTable } = this._chartStore[chartId];
        dataTable.rows().every(function () {
            this.node().classList.remove('selected');
        });
    }

    selectAllAnomalies(chartId) {
        const { dataTable } = this._chartStore[chartId];
        dataTable.rows().every(function () {
            this.node().classList.add('selected');
        });
    }

    createChartNode() {
        // create a bunch of node identifiers
        const chartId = MiscUtil.getRandId(8);
        const chartParentId = `chart_container_${chartId}`
        const chartNodeId = `chart_${chartId}`
        const chartControlsId = `chart_controls_${chartId}`
        const chartTableId = `chart_anomaly_table_${chartId}`
        const chartSelectStartDateId = `chart_select_startdate_${chartId}`;
        const chartSelectEndDateId = `chart_select_enddate_${chartId}`;

        // create new dom node
        const newChartStr = `
            <div id="${chartParentId}" style="display: flex; flex-flow: row nowrap; height: 625px; padding: 12px 0px; border-bottom: 1px solid #959595;">
                <div id="${chartNodeId}" style="flex: 1 1; height: 100%; padding: 0px 8px;"></div>
                <div id="${chartControlsId}" style="flex-basis: 40%; width: 40%; height: 100%; display: flex; flex-flow: column nowrap; padding: 0px 8px;">
                    <div style="flex: 1 1; overflow: hidden; display: flex; flex-flow: column;">
                        <table id="${chartTableId}" class="display table-responsive cell-border" style="flex: 1 1;">
                            <thead>
                                <tr>
                                    <th class="qth">Anomaly</th>
                                    <th class="qth">Start Time</th>
                                    <th class="qth">End Time</th>
                                </tr>
                            </thead>
                        </table>
                        <div style="flex-basis: 24px; height: 24px; text-align: right; margin-top: -24px; z-index: 2;">
                            <input type="button" value="None" onClick="chartUtil.clearAllAnomalies('${chartId}')" />
                            <input type="button" value="All" onClick="chartUtil.selectAllAnomalies('${chartId}')" />
                        </div>
                    </div>
                    <div style="flex-basis: 40px; height: 40px; display: flex; flex-flow: row nowrap; padding: 4px 0px;">
                        <div style="flex: 1 1; display: flex; justify-content: flex-start; align-items: center; padding-right: 8px;">
                            <label for="${chartSelectStartDateId}" style="padding-right: 4px;">Start Date</label>
                            <input id="${chartSelectStartDateId}" name="${chartSelectStartDateId}" placeholder="yyyy-mm-dd" style="flex: 1 1;" />
                        </div>
                        <div style="flex: 1 1; display: flex; justify-content: flex-end; align-items: center;">
                            <label for="${chartSelectEndDateId}" style="padding-right: 4px;">End Date</label>
                            <input id="${chartSelectEndDateId}" name="${chartSelectEndDateId}" placeholder="yyyy-mm-dd" style="flex: 1 1;" />
                        </div>
                    </div>
                    <div style="flex-basis: 24px; height: 24px; text-align: right;">
                        <input type="button" value="Remove" onClick="chartUtil.removeChart('${chartId}')" />
                        <input type="button" value="Reset" onClick="chartUtil.resetChart('${chartId}')" />
                        <input type="button" value="Update" onClick="chartUtil.updateChart('${chartId}')" />
                    </div>
                </div>
            </div>
        `

        // add nodes into the dom
        $("#charts_list").append(newChartStr);

        return {
            chartId,
            chartParentId,
            chartNodeId,
            chartControlsId,
            chartTableId,
            chartSelectStartDateId,
            chartSelectEndDateId
        }
    }

    resetChart(chartId) {
        const { idSet, minDate, maxDate } = this._chartStore[chartId];
        const { chartSelectStartDateId, chartSelectEndDateId } = idSet;

        // reset dates
        const sDateInput = $(`#${chartSelectStartDateId}`)[0]._flatpickr;
        const eDateInput = $(`#${chartSelectEndDateId}`)[0]._flatpickr;
        sDateInput.setDate(minDate);
        eDateInput.setDate(maxDate);

        // clear selections
        this.clearAllAnomalies(chartId);

        // refresh the chart
        this.updateChart(chartId);
    }

    updateChart(chartId) {
        const { chart, dataTable, fullData, idSet, minDate, maxDate } = this._chartStore[chartId];
        const { chartSelectStartDateId, chartSelectEndDateId } = idSet;

        // get selected anomaly IDs
        const selectedIds = {};
        dataTable.rows('.selected').every(function () {
            const rowData = this.data();
            selectedIds[rowData.anomalyId] = true;
        });

        // parse out date from selectors
        let sDate = minDate;
        let eDate = maxDate;

        const sDateInput = $(`#${chartSelectStartDateId}`)[0]._flatpickr;
        const eDateInput = $(`#${chartSelectEndDateId}`)[0]._flatpickr;

        if (sDateInput) {
            const sDateVal = sDateInput.selectedDates[0];
            sDate = parseInt(`${sDateVal.getFullYear()}${MiscUtil.padNum(sDateVal.getMonth() + 1, 2)}${MiscUtil.padNum(sDateVal.getDate(), 2)}${MiscUtil.padNum(sDateVal.getHours(), 2)}${MiscUtil.padNum(sDateVal.getMinutes(), 2)}`) // use int for comparison
        }
        if (eDateInput) {
            const eDateVal = eDateInput.selectedDates[0];
            eDate = parseInt(`${eDateVal.getFullYear()}${MiscUtil.padNum(eDateVal.getMonth() + 1, 2)}${MiscUtil.padNum(eDateVal.getDate(), 2)}${MiscUtil.padNum(eDateVal.getHours(), 2)}${MiscUtil.padNum(eDateVal.getMinutes(), 2)}`) // use int for comparison
        }

        // filter data to selection
        // TODO - filter by time
        let filteredValues = fullData.values;
        const numSelected = Object.keys(selectedIds).length;
        filteredValues = fullData.values.filter(entry => {
            const [x, y, lat, lon, time, anom_id] = entry;
            return (!!selectedIds[anom_id] || numSelected == 0) && time >= sDate && time < eDate;
        });


        chart.setOption({
            title: {
                subtext: `${filteredValues.length} Points`
            },
            dataset: {
                source: filteredValues
            }
        })
    }

    removeChart(chartId) {
        const { chart, idSet } = this._chartStore[chartId];
        const { chartParentId } = idSet;

        echarts.dispose(chart);

        $(`#${chartParentId}`).remove();

        this._chartStore[chartId] = null;
        delete this._chartStore[chartId];
    }
}

class MapUtil {
    constructor(nodeId) {
        this._nodeId = nodeId;

        this._map = this.initMap(this._nodeId);
    }

    initMap(nodeId) {
        // init basic map
        const map = L.map(nodeId, {
            minZoom: 2,
            maxZoom: 11
        }).setView([0, 0], 2);

        // add base layers
        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // add draw layers/tools
        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        var drawControlFull = new L.Control.Draw({
            draw: {
                polygon: false,
                rectangle: true,
                marker: false,
                circle: false,
                polyline: false
            },
            edit: {
                featureGroup: drawnItems,
                remove: true
            }
        });
        map.addControl(drawControlFull);

        var drawControlEditOnly = new L.Control.Draw({
            edit: {
                featureGroup: drawnItems
            },
            draw: false
        });

        // add event tracking
        map.on(L.Draw.Event.CREATED, (evt) => {
            const {
                layer
            } = evt;
            drawnItems.addLayer(layer);
            drawControlFull.remove(map);
            drawControlEditOnly.addTo(map)
        });

        map.on(L.Draw.Event.DELETED, (evt) => {
            if (drawnItems.getLayers().length === 0) {
                drawControlEditOnly.remove(map);
                drawControlFull.addTo(map);
            };
        });

        map.on(L.Draw.Event.EDITED, (evt) => {
            const {
                layers
            } = evt;
            layers.eachLayer((layer) => {
                console.log("EDIT", layer);
            });
        });

        return map;
    }

    addPoly(options) {
        const { coords, color = "#000000", zoomTo = true } = options;

        // create an orange rectangle
        const poly = L.polygon(coords, { color: color, weight: 1 }).addTo(this._map);

        // zoom the map to the bounds
        if (zoomTo) {
            this._map.fitBounds(poly.getBounds());
        }
    }
}