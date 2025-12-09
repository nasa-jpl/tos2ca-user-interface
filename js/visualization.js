class MiscUtil {
  static getURI() {
    var url = window.location.href;
    var ind = url.lastIndexOf('/');
    return url.substring(0, ind);
  }

  static getRandId(length) {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  static randIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  static round(num, prec = 4) {
    return Number(Math.round(num + 'e' + prec) + 'e-' + prec);
  }

  static parseDate(inputDate, hrSep = ' ') {
    const orig = inputDate;
    const dateStr = `${inputDate}`.split('.')[0]; // handle date passed as integer/float

    if (dateStr.match(/^[0-9]{13}$/)) {
      // milliseconds since epoch
      const mDate = moment(parseFloat(orig));
      const date = mDate.toDate();
      const intDate = parseInt(mDate.format('YYYYMMDDHHmm'));
      const strDate = mDate.format(`YYYY-MM-DD${hrSep}HH:mm`);
      return {
        str: strDate,
        date,
        intDate,
        orig,
      };
    } else if (dateStr.match(/^[0-9]{10}$/) != null) {
      // seconds since epoch
      const mDate = moment(parseFloat(orig) * 1000);
      const date = mDate.toDate();
      const intDate = parseInt(mDate.format('YYYYMMDDHHmm'));
      const strDate = mDate.format(`YYYY-MM-DD${hrSep}HH:mm`);
      return {
        str: strDate,
        date,
        intDate,
        orig,
      };
    } else if (dateStr.match(/^[0-9]{12}$/) != null) {
      // YYYYMMDDHHMM
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const hr = dateStr.substring(8, 10);
      const min = dateStr.substring(10, 12);

      const date = new Date(year, month - 1, day, hr, min);
      const intDate = parseInt(orig);
      return {
        str: `${year}-${month}-${day}${hrSep}${hr}:${min}`,
        date,
        intDate,
        orig,
      };
    } else if (
      dateStr.match(
        /^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$/
      )
    ) {
      // YYYY-MM-DD HH:mm:ss
      const {
        groups: { year, month, day, hr, min, sec = '00' },
      } =
        /^(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2}) (?<hr>[0-9]{2}):(?<min>[0-9]{2})(:(?<sec>[0-9]{2}))?$/.exec(
          dateStr
        );

      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hr),
        parseInt(min)
      );
      const intDate = parseInt(`${year}${month}${day}${hr}${min}`);
      return { str: dateStr, date, intDate, orig };
    }

    return null;
  }

  static formatDate(date) {
    return `${date.getUTCFullYear()}-${MiscUtil.padNum(
      date.getUTCMonth() + 1,
      2
    )}-${MiscUtil.padNum(date.getUTCDate(), 2)} ${MiscUtil.padNum(
      date.getUTCHours(),
      2
    )}:${MiscUtil.padNum(date.getUTCMinutes(), 2)}`;
  }

  static padNum(number, length, char = '0') {
    var numStr = `${number}`;
    while (numStr.length < length) {
      numStr = `0${numStr}`;
    }
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
            headers: {
              'content-type': 'application/x-www-form-urlencoded',
              accept: 'application/json',
            },
            body: params,
          };
        }

        const req = await fetch(url, fetchOpts);
        if (!req.ok) {
          reject(new Error('Failed to fetch JSON'));
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
    const shapeTypeRegEx = /^\w+/gi;
    const coordSetsRegEx = /\([-?\d., ]+\)/gi;

    const shapeTypeMatches = wktString.match(shapeTypeRegEx);
    if (shapeTypeMatches.length) {
      const shape = shapeTypeMatches[0].toLowerCase();
      if (shape === 'polygon') {
        const coordSetsMatches = wktString.match(coordSetsRegEx);
        if (coordSetsMatches) {
          // no support for inner-cutouts
          const coordString = coordSetsMatches[0];
          const coordPieces = coordString
            .replace('(', '')
            .replace(')', '')
            .split(',');
          const coords = coordPieces.map((cStr) => {
            return cStr
              .trim()
              .split(' ')
              .map((x) => parseFloat(x))
              .reverse(); // coordinates are backwards
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
  constructor(max = 15) {
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

    return item;
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
    this._datastore = new DataCache();
  }

  async getData(options = {}) {
    console.time('Get data');
    let {
      anomalies,
      times,
      area,
      files,
      jobId,
      isClimatologyChart = false,
      baseUrl = 'https://yourwebsite.com/getVizData/',
      dataBinRes = 'none',
    } = options;

    if (isClimatologyChart) {
      const cacheKey = `climatology_${jobId}`;
      let data = this._datastore.get(cacheKey);
      if (!data) {
        console.time('Fetch data');
        const appRoot = MiscUtil.getURI();
        const promArr = files.map((f) => {
          return fetch(`${appRoot}/GetJsonByKey.php?key=${f}`).then((res) => {
            if (res.status >= 400) {
              console.timeEnd('Get data');
              throw new Error('failed to fetch');
            }
            return res.json();
          });
        });
        const dataCollection = await Promise.all(promArr);
        console.timeEnd('Fetch data');
        data = this.reshapeData(dataCollection);
        data = this.processData(data, { dataBinRes });

        data.subtitle = `Mask Job: ${jobId}`; // poke in job id for subtitle

        if (data) {
          this._datastore.add(cacheKey, data);
        }
      }

      console.timeEnd('Get data');
      console.log('fetched data', data);
      return data;
    } else {
      // build query from options
      const queryArr = [];

      if (files) {
        files = Array.isArray(files) ? files : [files];
        queryArr.push(`files=${files.join(',')}`);
      } else {
        console.warn('No files specified');
        console.timeEnd('Get data');
        return null;
      }

      if (area) {
        if (Array.isArray(area) && area.length === 4) {
          queryArr.push(`area=${area.join(',')}`);
        } else {
          console.warn('Bad area', area);
        }
      }

      if (times) {
        times = Array.isArray(times) ? times : [times];
        queryArr.push(`times=${times.join(',')}`);
      }

      if (anomalies) {
        anomalies = Array.isArray(anomalies) ? anomalies : [anomalies];
        queryArr.push(`ids=${anomalies.join(',')}`);
      }

      const url = `${baseUrl}?${queryArr.join('&')}`;

      // check if this query is cached
      let data = this._datastore.get(url);

      if (!data) {
        try {
          console.time('Fetch data');
          data = await fetch(url).then((res) => {
            if (res.status >= 400) {
              throw new Error('failed to fetch');
            }
            return res.json();
          });

          console.timeEnd('Fetch data');
          if (data.error) {
            console.log('Chart error', data);
            console.timeEnd('Get data');
            return null;
          }

          data = this.processData(data, { dataBinRes });
          data.subtitle = `Mask Job: ${jobId}`; // poke in job id for subtitle

          if (data) {
            this._datastore.add(url, data);
          }
        } catch (err) {
          console.log(err);
          console.timeEnd('Get data');
          return null;
        }
      }

      console.log('fetched data', data);
      console.timeEnd('Get data');
      return data;
    }
  }

  reshapeData(dataCollection) {
    console.time('Reshape data');
    const rep = dataCollection[0];
    const { variables: variableList, units: unitsList } = rep;
    const { columns } = rep.data;

    const axisLabels = variableList.map((v, i) => {
      return `${v} (${unitsList[i]})`;
    });

    const rows = dataCollection.reduce((acc, dataset) => {
      return acc.concat(dataset.data.rows);
    }, []);

    console.timeEnd('Reshape data');
    return {
      title: variableList.join(' x '),
      axis_labels: axisLabels,
      var_list: variableList,
      data: {
        rows,
        columns,
      },
    };
  }

  processData(dataPkg, opts = {}) {
    console.time('Process data');
    const { dataBinRes = 'none' } = opts;
    try {
      let dfData = new dfd.DataFrame(dataPkg.data.rows, {
        columns: dataPkg.data.columns,
      });

      // TODO - do better filtering so we don't drop rows with only some NaN
      dfData.dropNa({ axis: 1, inplace: true });

      // convert datetime to UTC timestamp
      console.time('Parse timestamp');
      dfData = dfData.apply(
        (row) => {
          row[0] = MiscUtil.parseDate(row[0]).date.getTime();
          return row;
        },
        { axis: 1 }
      );
      console.timeEnd('Parse timestamp');

      // process data
      let minDate = Number.POSITIVE_INFINITY;
      let maxDate = Number.NEGATIVE_INFINITY;

      // extract columns indexes
      let cols = dfData.columns;
      let dateInd = cols.indexOf('datetime');
      let anomIdInd = cols.indexOf('anom_id');

      // need to add bogus anomaly ID column
      if (anomIdInd === -1) {
        console.time('Add anom ID column');
        const anomIDArr = new Array(dfData.values.length).fill(1);
        dfData.addColumn('anom_id', anomIDArr, { inplace: true });

        cols = dfData.columns;
        dateInd = cols.indexOf('datetime');
        anomIdInd = cols.indexOf('anom_id');
        console.timeEnd('Add anom ID column');
      }

      // rebin the data
      console.log(dataBinRes);
      if (dataBinRes !== 'none') {
        dfData = this.rebinData(dfData, dataBinRes);
      }

      const anomalyMetadata = dfData.values.reduce((acc, ent) => {
        const date = ent[dateInd];
        const anomalyId = ent[anomIdInd];

        // update anomaly info
        if (acc[anomalyId]) {
          acc[anomalyId].startDate = Math.min(acc[anomalyId].startDate, date);
          acc[anomalyId].endDate = Math.max(acc[anomalyId].endDate, date);
        } else {
          acc[anomalyId] = {
            anomalyId,
            startDate: date,
            endDate: date,
          };
        }

        // update date bounds tracking
        minDate = Math.min(minDate, date);
        maxDate = Math.max(maxDate, date);

        return acc;
      }, {});

      // extract all the anomaly ids in the data
      const anomIds = Object.keys(anomalyMetadata)
        .map((x) => parseInt(x))
        .sort((a, b) => a - b);

      console.timeEnd('Process data');

      return {
        title: dataPkg.title,
        axisLabels: dataPkg.axis_labels,
        varList: dataPkg.var_list,
        data: dfData,
        anomIds,
        anomalyMetadata,
        minDate,
        maxDate,
      };
    } catch (err) {
      console.warn(err);
      console.timeEnd('Process data');
      return false;
    }
  }

  rebinData(df, resolution = 'day') {
    console.time('Rebin Data');
    // prep trackers
    const resRef = moment.duration(1, resolution).asMilliseconds();
    const start = df['datetime'].min();
    let inc = start;
    let ind = 0;
    let chunkDataFrames = [];
    let currStartInd = ind;
    let step = inc;

    // manipulate starting inc to the start of the window
    inc = moment.utc(inc).startOf(resolution);

    console.time('splitting');
    // separate out all of the chunks
    while (ind < df.values.length) {
      // step = moment(df.at(ind, 'datetime'));
      // const stepDur = step.diff(inc);
      step = df.at(ind, 'datetime');
      const stepDur = step - inc;
      if (stepDur >= resRef) {
        // collect the current chunk and add it to the tracker
        const rowInd =
          currStartInd === ind ? currStartInd : `${currStartInd}:${ind}`;
        chunkDataFrames.push(df.iloc({ rows: [rowInd] }));

        // increment index trackers
        currStartInd = ind;
        inc = step;
      }

      ++ind;
    }
    console.timeEnd('splitting');

    // collect the final chunk and add it to the tracker
    const rowInd =
      currStartInd === ind ? currStartInd : `${currStartInd}:${ind}`;
    chunkDataFrames.push(df.iloc({ rows: [rowInd] }));

    // get columns to drop for each stat
    const minDCols = df.columns.filter((x) => x.indexOf('_min') === -1);
    const maxDCols = df.columns.filter((x) => x.indexOf('_max') === -1);
    const meanDCols = df.columns.filter((x) => x.indexOf('_mean') === -1);
    // const stdDevDCols = df.columns.filter((x) => x.indexOf('_std_dev') === -1);

    // calculate stats for each chunk and spread across each step in the data
    console.time('squashing');
    let dataColumns = [];
    const dataRows = chunkDataFrames.map((c, i) => {
      // break up the chunk data frame into min, max, mean, std_dev frames for aggregation
      const minDf = c.drop({ columns: minDCols, inplace: false });
      const maxDf = c.drop({ columns: maxDCols, inplace: false });
      const meanDf = c.drop({ columns: meanDCols, inplace: false });
      // const stdDevDf = c.drop({ columns: stdDevDCols, inplace: false });

      // calculate stats
      const minSeries = minDf.min({ axis: 0 });
      const maxSeries = maxDf.max({ axis: 0 });
      const meanSeries = meanDf.mean({ axis: 0 });
      // const stdDevSeries = stdDevDf.mean({ axis: 0 }); // TODO - is this right?

      // stack the aggregate series together
      const cDate = c.at(c.index[0], 'datetime');
      const chunkTime = moment
        .utc(cDate)
        .startOf(resolution)
        .toDate()
        .getTime();
      const anomId = c.at(c.index[0], 'anom_id');
      if (dataColumns.length === 0) {
        dataColumns = [
          'datetime',
          'anom_id',
          ...minSeries.index,
          ...maxSeries.index,
          ...meanSeries.index,
          // ...stdDevSeries.index,
        ];
      }
      return [
        chunkTime,
        anomId,
        ...minSeries.values,
        ...maxSeries.values,
        ...meanSeries.values,
        // ...stdDevSeries.values,
      ];
    });
    console.timeEnd('squashing');

    // stack all the chunks together then resort by datetime
    console.time('stacking');
    const newDf = new dfd.DataFrame(dataRows, { columns: dataColumns });
    newDf.sortValues('datetime', { inplace: true });
    console.timeEnd('stacking');

    console.timeEnd('Rebin Data');

    return newDf;
  }

  applyExprToDataFrame(options) {
    console.time('Apply Expr to Frame');

    // sample: 2 * {x} + 0.75 * {y}
    const { dataFrame, axisMap } = options;
    let { expr } = options; // need to clean expression for evaluation

    // get rid of whitespace and parentheses
    expr = expr.replaceAll(' ', '').replaceAll('(', '').replaceAll(')', '');

    // reverse because recursion will evaluate from bottom up
    // add, subtract, multiply, divide, exponent
    const opStrs = ['+', '-', '*', '/', '^'];

    // split expression on operators and recurse to apply
    for (let i = 0; i < opStrs.length; ++i) {
      const opStr = opStrs[i];
      const opPieces = expr.split(opStr);
      if (opPieces.length > 1) {
        const leftVal = this.applyExprToDataFrame({
          dataFrame,
          axisMap,
          expr: opPieces[0],
        });
        const rightVal = this.applyExprToDataFrame({
          dataFrame,
          axisMap,
          expr: opPieces.slice(1).join(opStr),
        });

        if (typeof leftVal === 'undefined' || typeof rightVal === 'undefined') {
          console.warn('Failed to apply expression to data frame');
          return 0;
        } else if (
          typeof leftVal === 'number' &&
          typeof rightVal === 'object'
        ) {
          let applyFunc;
          switch (opStr) {
            case '^':
              applyFunc = (x) => Math.pow(leftVal, x);
              break;
            case '/':
              applyFunc = (x) => leftVal / x;
              break;
            case '*':
              applyFunc = (x) => leftVal * x;
              break;
            case '-':
              applyFunc = (x) => leftVal - x;
              break;
            case '+':
              applyFunc = (x) => leftVal + x;
              break;
            default:
              console.warn(`Unknown op str: ${opStr}`);
              applyFunc = (x) => x;
          }
          return rightVal.apply(applyFunc);
        } else if (
          typeof leftVal === 'number' &&
          typeof rightVal === 'number'
        ) {
          switch (opStr) {
            case '^':
              return leftVal ** rightVal;
            case '/':
              return leftVal / rightVal;
            case '*':
              return leftVal * rightVal;
            case '-':
              return leftVal - rightVal;
            case '+':
              return leftVal + rightVal;
            default:
              console.warn(`Unknown op str: ${opStr}`);
              return 0;
          }
        } else {
          switch (opStr) {
            case '^':
              return leftVal.pow(rightVal);
            case '/':
              return leftVal.div(rightVal);
            case '*':
              return leftVal.mul(rightVal);
            case '-':
              return leftVal.sub(rightVal);
            case '+':
              return leftVal.add(rightVal);
            default:
              console.warn(`Unknown op str: ${opStr}`);
              return 0;
          }
        }
      }
    }

    // parse as a number
    const floatVal = parseFloat(expr);
    if (!isNaN(floatVal)) {
      return floatVal;
    }

    // no op strings or numbers found, its a variable string
    const { varStr } = /{(?<varStr>[a-z_]+)}/gi.exec(expr).groups;
    const colName = axisMap[varStr] || varStr;

    console.timeEnd('Apply Expr to Frame');

    return dataFrame[colName];
  }

  getClimatology(opts) {
    console.time('generate climatology');

    const {
      dataFrame,
      resolution = 'month',
      type = 'standard',
      skip_step = 0,
    } = opts;

    // duplicate dataframe
    const df = dataFrame.copy();
    df.resetIndex({ inplace: true });

    const start = df['datetime'].min();
    const end = df['datetime'].max();

    // trim columns that aren't datetime and means
    const dCols = df.columns.filter(
      (x) => x !== 'datetime' && x.indexOf('mean') === -1
    );
    df.drop({ columns: dCols, inplace: true });

    let climDf;
    let inc = start;
    let ind = 0;

    if (type === 'rolling') {
      while (inc <= end) {
        // step back one resolution from current index
        const step = moment(df.at(ind, 'datetime')).subtract(1, resolution);
        const stepTime = step.toDate().getTime();

        // filter to the current step
        const filtDf = df.query(
          df['datetime'].le(inc).and(df['datetime'].gt(stepTime))
        );

        // calculate mean of means and std dev of means
        const meanSeries = filtDf.mean({ axis: 0 });
        const stdDevSeries = filtDf.std({ axis: 0 });
        const meanMinusSeries = meanSeries.sub(stdDevSeries);
        const stdDevDoubleSeries = stdDevSeries.mul(2);

        // build new dataframe
        const vals = [
          ...meanSeries.values.slice(1),
          ...stdDevSeries.values.slice(1),
          ...meanMinusSeries.values.slice(1),
          ...stdDevDoubleSeries.values.slice(1),
        ];
        const stepMeanDf = new dfd.DataFrame([[inc, ...vals]], {
          columns: meanSeries.index
            .concat(
              meanSeries.index
                .slice(1)
                .map((x) => x.replace('_mean', '_mean_std_dev'))
            )
            .concat(
              meanSeries.index
                .slice(1)
                .map((x) => x.replace('_mean', '_mean_minus_std_dev'))
            )
            .concat(
              meanSeries.index
                .slice(1)
                .map((x) => x.replace('_mean', '_double_std_dev'))
            ),
        });

        // add to the climatology data frame
        if (climDf) {
          climDf = climDf.append(stepMeanDf, [ind]);
        } else {
          climDf = stepMeanDf;
        }

        // increment step
        ind++;
        if (ind >= df.values.length) {
          break;
        }
        inc = df.at(ind, 'datetime');
      }
    } else if (type === 'skip_step') {
      // Skip-Step allows you to create a climatology based on cadence.
      // For example, to create a climatology for each month you could use
      // a resolution of 'month' and a skip count of '11' which would give you
      // a climatology with 12 values, one for each month of the year

      // prep trackers
      const resRef = moment.duration(1, resolution).asMilliseconds();
      let chunkDataFrames = [];
      let currStartInd = ind;
      let step = inc;
      let chunkInd = 0;

      // manipulate starting inc to the start of the window
      inc = moment.utc(inc).startOf(resolution);

      // separate out all of the chunks
      while (ind < df.values.length) {
        step = moment(df.at(ind, 'datetime'));
        const stepDur = step.diff(inc);
        if (stepDur >= resRef) {
          // collect the current chunk and add it to the tracker
          const chunk = df.iloc({ rows: [`${currStartInd}:${ind}`] });
          if (chunkDataFrames.length <= chunkInd) {
            chunkDataFrames.push(chunk);
          } else {
            chunkDataFrames[chunkInd] = dfd.concat({
              dfList: [chunkDataFrames[chunkInd], chunk],
              axis: 0,
            });
          }

          // increment index trackers
          currStartInd = ind;
          inc = step;
          ++chunkInd;
          if (chunkInd > skip_step) {
            chunkInd = 0;
          }
        }

        ++ind;
      }

      // collect the final chunk and add it to the tracker
      const chunk = df.iloc({ rows: [`${currStartInd}:${ind}`] });
      if (chunkDataFrames.length <= chunkInd) {
        chunkDataFrames.push(chunk);
      } else {
        chunkDataFrames[chunkInd] = dfd.concat({
          dfList: [chunkDataFrames[chunkInd], chunk],
          axis: 0,
        });
      }

      // calculate stats for each chunk and spread across each step in the data
      chunkDataFrames = chunkDataFrames.map((chunk) => {
        const meanSeries = chunk.mean({ axis: 0 });
        const stdDevSeries = chunk.std({ axis: 0 });
        const meanMinusSeries = meanSeries.sub(stdDevSeries);
        const stdDevDoubleSeries = stdDevSeries.mul(2);

        // create filled frames
        const meanDfColumns = meanSeries.index
          .slice(1)
          .concat(
            meanSeries.index
              .slice(1)
              .map((x) => x.replace('_mean', '_mean_std_dev'))
          )
          .concat(
            meanSeries.index
              .slice(1)
              .map((x) => x.replace('_mean', '_mean_minus_std_dev'))
          )
          .concat(
            meanSeries.index
              .slice(1)
              .map((x) => x.replace('_mean', '_double_std_dev'))
          );
        const meanDfRow = [
          ...meanSeries.values.slice(1),
          ...stdDevSeries.values.slice(1),
          ...meanMinusSeries.values.slice(1),
          ...stdDevDoubleSeries.values.slice(1),
        ];
        const meanDfRows = [];
        for (let i = 0; i < chunk.values.length; ++i) {
          meanDfRows.push(meanDfRow);
        }
        const meanDf = new dfd.DataFrame(meanDfRows, {
          columns: meanDfColumns,
        });

        // drop all columns except for datetime
        const chunkDCols = df.columns.filter((x) => x !== 'datetime');
        chunk.drop({ columns: chunkDCols, inplace: true });

        // restack the frame together
        return dfd.concat({ dfList: [chunk, meanDf], axis: 1 });
      });

      // stack all the chunks together then resort by datetime
      climDf = dfd.concat({ dfList: chunkDataFrames, axis: 0 });
      climDf.sortValues('datetime', { inplace: true });
    } else {
      const step = moment(inc);
      while (inc < end) {
        // step one resolution forward from previous bin
        step.add(1, resolution);

        // filter to the current step
        const filtDf = df.query(
          df['datetime'].ge(inc).and(df['datetime'].lt(step.toDate().getTime()))
        );

        // calculate mean of means and std dev of means
        const meanSeries = filtDf.mean({ axis: 0 });
        const stdDevSeries = filtDf.std({ axis: 0 });
        const meanMinusSeries = meanSeries.sub(stdDevSeries);
        const stdDevDoubleSeries = stdDevSeries.mul(2);

        // build new dataframe
        const vals = [
          ...meanSeries.values.slice(1),
          ...stdDevSeries.values.slice(1),
          ...meanMinusSeries.values.slice(1),
          ...stdDevDoubleSeries.values.slice(1),
        ];
        const stepMeanDf = new dfd.DataFrame(
          [
            [filtDf['datetime'].min(), ...vals],
            [filtDf['datetime'].max(), ...vals],
          ],
          {
            columns: meanSeries.index
              .concat(
                meanSeries.index
                  .slice(1)
                  .map((x) => x.replace('_mean', '_mean_std_dev'))
              )
              .concat(
                meanSeries.index
                  .slice(1)
                  .map((x) => x.replace('_mean', '_mean_minus_std_dev'))
              )
              .concat(
                meanSeries.index
                  .slice(1)
                  .map((x) => x.replace('_mean', '_double_std_dev'))
              ),
          }
        );

        // add to the climatology data frame
        if (climDf) {
          climDf = climDf.append(stepMeanDf, [ind * 2, ind * 2 + 1]);
        } else {
          climDf = stepMeanDf;
        }

        // increment step
        inc = step.toDate().getTime();
        ind++;
      }
    }

    console.timeEnd('generate climatology');
    console.log('Climatology', climDf);

    return climDf;
  }

  getRandData(options) {
    const { count, dim, series } = options;

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
    };

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
    this._selectedAnomalyIds = {};
  }

  initDatatable() {
    // initialize the table
    const dataTable = new DataTable(`#vis_anom_summary_list`, {
      paging: false,
      searching: false,
      scrollCollapse: true,
      scrollY: '250px',
      fixedColumns: true,
      columns: [
        { data: 'anomalyId', className: 'text-left' },
        { data: 'startDate', className: 'text-center' },
        { data: 'endDate', className: 'text-center' },
      ],
      columnDefs: [
        // Center align both header and body content of columns 1, 2 & 3
        { className: 'dt-head-center', targets: [0, 1, 2] },
        { width: '40%', targets: [1, 2] },
      ],
      data: [],
    });

    // enable multiple selection
    dataTable.on('click', 'tbody tr', (e) => {
      e.currentTarget.classList.toggle('selected');
      const select = e.currentTarget.classList.contains('selected');
      const { row: rowIdx } = e.target._DT_CellIndex;
      const row = dataTable.row(rowIdx);
      const { anomalyId } = row.data();

      this.selectAnomalyId(anomalyId, select);

      const { id: jobId } = this.getCurrJob();
      _glob_mapUtil.highlightMatchingFeatures({
        layerKey: '_id',
        layerValue: `poly_set_${jobId}_${anomalyId}`,
        reset: !select,
      });
    });

    return dataTable;
  }

  selectTableRowById(anomalyId, select = true) {
    const row = this._datatable.row(
      (idx, data) => data.anomalyId === anomalyId
    );
    const node = row.node();
    if (select && !node.classList.contains('selected')) {
      node.classList.add('selected');
    } else {
      node.classList.remove('selected');
    }
  }

  resetJobTracker() {
    this._currJob = {
      id: undefined,
      files: {},
      anomList: [],
      jobSumm: undefined,
    };
    this._selectedAnomalyIds = {};
  }

  getCurrJob() {
    return { ...this._currJob };
  }

  async fetchJob(jobId) {
    this.setJobLoading(true);
    this.clearCurrentJob();

    console.log(`fetching: ${jobId}`);
    const appRoot = MiscUtil.getURI();

    // first get the overall job info
    let jobSumm;
    try {
      jobSumm = await MiscUtil.fetchJson(
        `${appRoot}/GetJob.php?jobID=${jobId}`
      );
    } catch (err) {
      console.warn(err);
      this.clearAndShowError();
      this.setJobLoading(false);
      return;
    }

    // normalize fields
    jobSumm.climatology = jobSumm.climatology === '1';

    // generate expected filenames
    const algo =
      jobSumm.algorithm.toLowerCase() === 'auxgeoir' ? 'AuxGeoIR' : 'ForTraCC';
    const tocFile = `${jobId}/${jobId}-${algo}-TOC.json`;
    const maskHierarchyFile = `${jobId}/${jobId}-${algo}-Mask-Output-Hierarchy.json`;

    // fetch all the job data
    const promArr = [];
    // promArr.push(MiscUtil.fetchJson(`${appRoot}/GetJob.php?jobID=${jobId}`));
    promArr.push(
      MiscUtil.fetchJson(`${appRoot}/GetJsonByKey.php?key=${tocFile}`)
    );
    promArr.push(
      MiscUtil.fetchJson(`${appRoot}/GetJsonByKey.php?key=${maskHierarchyFile}`)
    );
    promArr.push(MiscUtil.fetchJson(`${appRoot}/api/location?jobID=${jobId}`));
    promArr.push(
      MiscUtil.fetchJson(
        `${appRoot}/GetClimatologyFilesByJobID.php?jobID=${jobId}`
      )
    );

    // prepare to populate the page with the responses
    Promise.all(promArr)
      .then(([anomList, maskHierarchy, interpFiles, climatologyFiles]) => {
        const polyFiles = [];
        const times = Object.keys(maskHierarchy.masks)
          .sort()
          .map((timeStr) => {
            // build list of expected poly files
            polyFiles.push(`${jobId}/${jobId}-${timeStr}.json`);
            return MiscUtil.parseDate(timeStr);
          })
          .filter((x) => !!x);

        this._currJob = {
          id: jobId,
          files: { tocFile, maskHierarchyFile, polyFiles, climatologyFiles },
          anomList: anomList,
          jobSumm: jobSumm,
        };

        this.populateChartForms(jobId, jobSumm, anomList, interpFiles, times);
        this.populateJobSummary(jobId, jobSumm);

        this.setJobLoading(false);
      })
      .catch((err) => {
        console.warn(err);
        this.clearAndShowError();
        this.setJobLoading(false);
      });
  }

  setJobLoading(loading = true) {
    if (loading) {
      $('#fetch_job_btn').attr('value', 'Loading...');
      $('#fetch_job_btn').attr('disabled', true);
    } else {
      $('#fetch_job_btn').attr('value', 'Fetch Job');
      $('#fetch_job_btn').attr('disabled', false);
    }
  }

  clearCurrentJob() {
    if (this._currJob && this._currJob.id) {
      _glob_mapUtil.clearLayer({ key: '_type', value: 'job_bbox' });
      _glob_mapUtil.clearLayer({ key: '_type', value: 'anom_poly_set' });
    }
    this._datatable.clear();
    this._datatable.draw();
    this.resetJobTracker();
    $('#job_summ_data').remove();
    $('#chart_create_btn').attr('disabled', true);
  }

  clearAndShowError(err = 'Job Not Found') {
    this.clearCurrentJob();

    $('#job_summary_wrapper').html(`
          <div id="job_summ_data" class="vis_job-error">
              ${err}
          </div>
      `);
    $('#map_time-select').html('');
    $('#chart_variable_select_1').html('<option value="">None</option>');
    $('#chart_variable_select_2').html('<option value="">None</option>');
    $('#chart_variable_select_3').html('<option value="">None</option>');
    $('#vis_controls-chart_opts_hint').css('display', '');
    $('#vis_controls-chart_opts_climatology').css('display', 'none');
    $('#vis_controls-chart_opts').css('display', 'none');
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
    if (ineqOperator == 'lessThanOrEqualTo') {
      eqSym = '≤';
    } else if (ineqOperator == 'greaterThanOrEqualTo') {
      eqSym = '≥';
    } else if (ineqOperator == 'lessThan') {
      eqSym = '<';
    } else if (ineqOperator == 'greaterThan') {
      eqSym = '>';
    } else if (ineqOperator == 'standardDeviation') {
      eqSym = 'σ';
    }

    const summNodeStr = `
        <div id="job_summ_data">
            <div class="vis_job-summ-content">
                <div class="vis_job-summ-entry">
                    <div class="vis_job-summ-label">Description</div>
                    <div class="vis_job-summ-value">${
                      description || 'Not Available'
                    }</div>
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

    $('#job_summary_wrapper').html(summNodeStr);

    // add bbox to map
    const bounds = MiscUtil.parseWKTString(coords);
    _glob_mapUtil.addPoly({
      coords: bounds.coords,
      customOpts: { _id: `poly_bounds_${jobId}`, _type: 'job_bbox' },
    });

    // add first set of polygons to the map
    _glob_mapUtil.setTimePolyByIdx(0);
  }

  populateChartForms(jobId, jobSumm, anomSumm, interpFiles, times) {
    const {
      startDate: startDateStr,
      endDate: endDateStr,
      climatology,
    } = jobSumm;
    const startDate = MiscUtil.parseDate(startDateStr).date;
    const endDate = MiscUtil.parseDate(endDateStr).date;

    // format data for the table
    const tableData = anomSumm.map((anom) => {
      const { name, start_date, end_date } = anom;

      const anomalyId = name.match(/\d+/gi)[0];
      const sDate = MiscUtil.parseDate(start_date);
      const eDate = MiscUtil.parseDate(end_date);

      return { anomalyId, startDate: sDate.str, endDate: eDate.str };
    });

    // populate data table
    this._datatable.clear();
    this._datatable.rows.add(tableData);
    this._datatable.draw();

    // populate the time step selector
    const polyOptions = times.map((time) => {
      return `<option value="${jobId}/${jobId}-${time.intDate}.json">${time.str}</option>`;
    });
    $('#map_time-select').html(polyOptions.join(''));

    // populate date selectors
    $(`#chart_start_date_select`).flatpickr({
      enableTime: true,
      time_24hr: true,
      dateFormat: 'Y-m-d H:i',
      defaultDate: startDate,
      minuteIncrement: 15,
      // minDate,
      // maxDate,
    });
    $(`#chart_end_date_select`).flatpickr({
      enableTime: true,
      time_24hr: true,
      dateFormat: 'Y-m-d H:i',
      defaultDate: endDate,
      minuteIncrement: 15,
      // minDate,
      // maxDate,
    });

    // populate variable selectors
    const varOptions = interpFiles.map((ent) => {
      return `<option value="${ent.location}">${ent.variable}</option>`;
    });

    $('#chart_variable_select_1').html(varOptions.join(''));
    $('#chart_variable_select_2').html(varOptions.join(''));
    $('#chart_variable_select_3').html(
      [`<option value="">None</option>`].concat(varOptions).join('')
    );

    // disable for climatology charts
    if (climatology) {
      $('#vis_controls-chart_opts_climatology').css('display', '');
      $('#vis_controls-chart_opts').css('display', 'none');
    } else {
      $('#vis_controls-chart_opts').css('display', '');
      $('#vis_controls-chart_opts_climatology').css('display', 'none');
    }
    $('#vis_controls-chart_opts_hint').css('display', 'none');

    $('#chart_create_btn').attr('disabled', false);
  }

  isAnomalySelected(anomalyId) {
    return !!this._selectedAnomalyIds[anomalyId];
  }

  selectAnomalyId(anomalyId, selected = true) {
    if (selected) {
      this._selectedAnomalyIds[anomalyId] = true;
    } else {
      this._selectedAnomalyIds[anomalyId] = false;
      delete this._selectedAnomalyIds[anomalyId];
    }
  }

  getSelectedAnomalyIds() {
    const ids = Object.keys(this._selectedAnomalyIds).sort();
    if (ids.length) {
      return ids;
    }
  }
}

class ChartUtil {
  constructor() {
    this._dataUtil = new DataUtil();

    this._chartStore = {};

    this._stdFormatter = Intl.NumberFormat('en', {
      notation: 'compact',
    });

    this._dateFormatter = (val) => {
      return MiscUtil.formatDate(new Date(parseInt(val)));
    };

    window.addEventListener('resize', function () {
      for (const chartId in this._chartStore) {
        const { chart } = this._chartStore[chartId];
        chart.resize();
      }
    });
  }

  async createCharts(options = {}) {
    const startDateOpt = MiscUtil.parseDate(
      document.getElementById('chart_start_date_select').value
    ).intDate;
    const endDateOpt = MiscUtil.parseDate(
      document.getElementById('chart_end_date_select').value
    ).intDate;
    const variableOpt1 = document.getElementById(
      'chart_variable_select_1'
    ).value;
    const variableOpt2 = document.getElementById(
      'chart_variable_select_2'
    ).value;
    const variableOpt3 = document.getElementById(
      'chart_variable_select_3'
    ).value;
    const anomalyIdsOpt = _glob_jobUtil.getSelectedAnomalyIds();
    const areaOpt = _glob_mapUtil.getDrawnBounds();
    const { id: jobId, jobSumm, files } = _glob_jobUtil.getCurrJob();

    const isClimatologyChart = jobSumm.climatology;
    const treatAsClimatologyChart =
      document.getElementById('vis_is_climatology').checked;

    // const chartNodeIdSet = this.createChartNode(isClimatologyChart);
    const chartNodeIdSet = this.createChartNode(
      isClimatologyChart || treatAsClimatologyChart
    );
    const { chartId, chartNodeId } = chartNodeIdSet;
    const statNode = $(`#${chartNodeId}`).get(0);

    // init chart store
    this._chartStore[chartId] = { idSet: chartNodeIdSet, isClimatologyChart };

    const statsChart = echarts.init(statNode, 'light', {
      renderer: 'canvas',
    });
    statsChart.showLoading();

    // store charts
    this._chartStore[chartId] = {
      ...this._chartStore[chartId],
      charts: {
        stats: statsChart,
      },
    };

    // get file list
    const fileList = isClimatologyChart
      ? files.climatologyFiles.files.map((f) =>
          f.location.replace('s3://your-bucket-name/', '')
        )
      : [variableOpt1, variableOpt2, variableOpt3].filter((x) => x);

    // fetch data
    const dataPkg = await this._dataUtil.getData({
      times: [startDateOpt, endDateOpt],
      files: fileList,
      area: areaOpt,
      anomalies: anomalyIdsOpt,
      isClimatologyChart,
      jobId,
      dataBinRes: isClimatologyChart ? 'day' : 'none',
    });
    if (!dataPkg) {
      console.log('Failed to fetch data');
      this.clearAndShowError(chartId);
      return;
    }

    // store chart data
    this._chartStore[chartId] = { ...this._chartStore[chartId], dataPkg };

    try {
      // init the table with anomaly data
      const { minDate, maxDate, anomalyMetadata, varList } = dataPkg;
      this.initChartControls({
        anomalyMetadata,
        chartNodeIdSet,
        minDate,
        maxDate,
        varList,
      });

      // build stats chart
      const statsChartOpts = this.getChartOpts(dataPkg, {
        isClimatologyChart: isClimatologyChart || treatAsClimatologyChart,
      });
      statsChart.setOption(statsChartOpts);
      statsChart.hideLoading();

      return true;
    } catch (err) {
      console.warn(err);
      this.clearAndShowError(chartId);
      return;
    }
  }

  getChartOpts(dataPkg, opts = {}) {
    const { isClimatologyChart } = opts;
    if (isClimatologyChart) {
      return this.getTimeseriesChartOpts(dataPkg, opts);
    } else {
      return this.getScatterChartOpts(dataPkg, opts);
    }
  }

  getScatterChartOpts(plotData, options = {}) {
    const { data: dfData, varList, title, subtitle } = plotData;

    const customX = options.customX || `${varList[0]}_mean`;
    const customY = options.customY || `${varList[1]}_mean`;

    const xIsTime = customX === '{datetime}';

    const chartOpts = {
      animation: false,
      title: {
        text: title,
        subtext: subtitle,
        itemGap: 3,
      },
      tooltip: {
        transitionDuration: 0,
        axisPointer: {
          type: 'cross',
        },
        formatter: (parms, ticket, cb) => {
          const { color, value, dimensionNames: labels, encode } = parms;

          const xInd = encode.x[0];
          const yInd = encode.y[0];

          const [datetime, anomId] = value;
          const xLabel = labels[xInd];
          const yLabel = labels[yInd];
          const xValue = value[xInd];
          const yValue = value[yInd];

          return `
                  <div style="display: flex; flex-flow: row nowrap;">
                  <div style="flex-basis 20px; width: 20px; padding: 4px;">
                      <div style="display: block; border-radius: 50%; width: 10px; height: 10px; background: ${color}"></div>
                  </div>
                  <div style="display: flex; flex-flow: column; flex: 1 1;">
                  <div style="display: flex; flex-flow: row nowrap; flex: 1 1">
                      <div style="flex: 1 1; font-weight: bold;">${xLabel}</div>
                      <div style="flex: 1 1; font-family: monospace; text-align: right; padding-left: 8px;">${MiscUtil.round(
                        xValue,
                        5
                      )}</div>
                  </div>
                  <div style="display: flex; flex-flow: row nowrap; flex: 1 1">
                      <div style="flex: 1 1; font-weight: bold;">${yLabel}</div>
                      <div style="flex: 1 1; font-family: monospace; text-align: right; padding-left: 8px;">${MiscUtil.round(
                        yValue,
                        5
                      )}</div>
                  </div>
                  <div style="display: flex; flex-flow: row nowrap; flex: 1 1">
                      <div style="flex: 1 1; font-weight: bold;">Anomaly</div>
                      <div style="flex: 1 1; font-family: monospace; text-align: right; padding-left: 8px;">${anomId}</div>
                  </div>
                  <div style="display: flex; flex-flow: row nowrap; flex: 1 1">
                      <div style="flex: 1 1; font-weight: bold;">Time</div>
                      <div style="flex: 1 1; font-family: monospace; text-align: right; padding-left: 8px;">${MiscUtil.formatDate(
                        new Date(datetime)
                      )}</div>
                  </div>
              </div>
          </div>
          `;
        },
      },
      toolbox: {
        feature: {
          dataZoom: {
            brushStyle: {
              color: 'rgba(230, 230, 230, 0.75)',
              borderColor: 'rgba(0, 0, 0, 1)',
              borderWidth: 1,
              borderType: 'dashed',
            },
          },
          saveAsImage: {},
        },
      },
      grid: [
        { left: '5%', top: '10%', width: '42%', height: '80%' }, // custom opts
        { right: '5%', top: '10%', width: '40%', height: '35%' }, // mean x mean
        { right: '5%', bottom: '10%', width: '40%', height: '35%' }, // std dev x std dev
      ],
      xAxis: [
        {
          name: customX,
          nameLocation: 'center',
          position: 'bottom',
          nameGap: 25,
          axisLine: { onZero: false },
          scale: true,
          type: xIsTime ? 'time' : undefined,
          axisLabel: {
            formatter: !xIsTime ? this._stdFormatter.format : undefined,
          },
        },
      ].concat(
        [`${varList[0]}_mean`, `${varList[0]}_std_dev`].map((x, i) => {
          return {
            name: x,
            nameLocation: 'center',
            position: 'bottom',
            nameGap: 35,
            axisLine: { onZero: false },
            scale: true,
            axisLabel: {
              formatter: this._stdFormatter.format,
            },
            gridIndex: i + 1,
          };
        })
      ),
      yAxis: [
        {
          name: customY,
          type: 'value',
          nameLocation: 'center',
          nameGap: 40,
          nameRotate: 90,
          axisLine: { onZero: false },
          scale: true,
          gridIndex: 0,
          axisLabel: {
            formatter: this._stdFormatter.format,
          },
        },
      ].concat(
        varList.slice(1).reduce((acc, varStr, i) => {
          acc.push({
            name: `${varStr}_mean`,
            type: 'value',
            nameLocation: 'center',
            nameGap: 40,
            nameRotate: i % 2 ? -90 : 90,
            position: i % 2 ? 'right' : 'left',
            offset: i % 2 ? ((i - 1) / 2) * 50 : (i / 2) * 50,
            axisLine: { onZero: false },
            scale: true,
            gridIndex: 1,
            axisLabel: {
              formatter: this._stdFormatter.format,
            },
          });
          acc.push({
            name: `${varStr}_std_dev`,
            type: 'value',
            nameLocation: 'center',
            nameGap: 40,
            nameRotate: i % 2 ? -90 : 90,
            position: i % 2 ? 'right' : 'left',
            offset: i % 2 ? ((i - 1) / 2) * 50 : (i / 2) * 50,
            axisLine: { onZero: false },
            scale: true,
            gridIndex: 2,
            axisLabel: {
              formatter: this._stdFormatter.format,
            },
          });
          return acc;
        }, [])
      ),
      dataset: [
        {
          source: dfData.values,
          dimensions: dfData.columns.map((x) => {
            return {
              name: x,
              type:
                x === 'datetime' || x === '{datetime}'
                  ? 'time'
                  : x === 'anom_id'
                  ? 'int'
                  : 'float',
            };
          }),
        },
      ],
      series: [
        {
          type: 'scatter',
          symbolSize: 5,
          blendMode: 'source-over',
          large: true,
          xAxisIndex: 0,
          yAxisIndex: 0,
          encode: {
            x: customX,
            y: customY,
          },
        },
      ].concat(
        varList.reduce((acc, varStr, i) => {
          if (varStr !== varList[0]) {
            acc.push({
              type: 'scatter',
              symbolSize: 5,
              blendMode: 'source-over',
              large: true,
              xAxisIndex: 1,
              yAxisIndex: i == 1 ? 1 : 3,
              encode: {
                x: `${varList[0]}_mean`,
                y: `${varStr}_mean`,
              },
            });
            acc.push({
              type: 'scatter',
              symbolSize: 5,
              blendMode: 'source-over',
              large: true,
              xAxisIndex: 2,
              yAxisIndex: i == 1 ? 2 : 4,
              encode: {
                x: `${varList[0]}_std_dev`,
                y: `${varStr}_std_dev`,
              },
            });
          }
          return acc;
        }, [])
      ),
    };

    return chartOpts;
  }

  getTimeseriesChartOpts(plotData, options = {}) {
    const { data: dfData, varList, axisLabels, title, subtitle } = plotData;
    const {
      climatology = {
        dataFrame: dfData,
        resolution: 'week',
        type: 'standard',
        skip_step: 0,
      },
    } = options;

    const xAxis = 'datetime';

    const {
      resolution: clim_res,
      type: clim_type,
      skip_step: clim_skip,
    } = climatology;

    const climData = this._dataUtil.getClimatology(climatology);

    const getIndexVals = (varName, clim = false) => {
      if (clim) {
        const cols = climData.columns;
        return [`${varName}_mean`, `${varName}_mean_std_dev`].map((x) =>
          cols.indexOf(x)
        );
      }

      const cols = dfData.columns;
      return [
        `${varName}_min`,
        `${varName}_max`,
        `${varName}_mean`,
        `${varName}_std_dev`,
      ].map((x) => cols.indexOf(x));
    };

    const colors = [
      '#1b9e77',
      '#d95f02',
      '#7570b3',
      '#e7298a',
      '#66a61e',
      '#e6ab02',
      '#a6761d',
      '#666666',
    ];
    const styles = colors.map((c) => {
      return { stroke: c, fill: c, lineWidth: 2 };
    });

    const getRenderItem = (varName) => {
      const indexVals = getIndexVals(varName);

      return (params, api) => {
        const xValue = api.value(0);
        const min = api.value(indexVals[0]);
        const max = api.value(indexVals[1]);
        const mean = api.value(indexVals[2]);
        // const stdDev = api.value(indexVals[3]);

        // const meanH = mean + stdDev;
        // const meanL = mean - stdDev;

        const hPoint = api.coord([xValue, max]);
        const lPoint = api.coord([xValue, min]);
        const mPoint = api.coord([xValue, mean]);
        // const mhPoint = api.coord([xValue, meanH]);
        // const mlPoint = api.coord([xValue, meanL]);

        const halfWidth = 2;

        const styleInd = Math.floor(params.seriesIndex / 3) % styles.length;
        const style = styles[styleInd];

        return {
          type: 'group',
          style: style,
          children: [
            {
              type: 'line',
              shape: {
                x1: lPoint[0],
                y1: lPoint[1],
                x2: hPoint[0],
                y2: hPoint[1],
              },
            },
            {
              type: 'circle',
              style: style,
              shape: {
                cx: mPoint[0],
                cy: mPoint[1],
                r: halfWidth,
              },
            },
          ],
        };
      };
    };

    let full_subtitle = `${subtitle} · Climatology: ${clim_type} · Resolution: ${clim_res}`;
    if (clim_type === 'skip_step') {
      full_subtitle = `${full_subtitle} · Skip: ${clim_skip}`;
    }
    const chartOpts = {
      animation: false,
      title: {
        text: title,
        subtext: full_subtitle,
        itemGap: 0,
      },
      tooltip: {
        transitionDuration: 0,
        trigger: 'axis',
        position: function (pos, params, el, elRect, size) {
          var obj = { top: 50 };
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 70;
          return obj;
        },
        axisPointer: {
          type: 'cross',
        },
        formatter: (parms, ticket, cb) => {
          const rep = parms[0];

          const { value: repVals } = rep;
          const [datetime] = repVals;

          let climVals;
          if (climData.values.length < dfData.values.length) {
            // get the relevant row of climatology data
            climVals = climData.query(climData['datetime'].le(datetime)).values;
            climVals = climVals[climVals.length - 1];
          } else {
            climVals = climData.values[rep.dataIndex];
          }

          // filter out the confidence ranges
          parms = parms
            .filter((p) => p.componentSubType === 'custom')
            .sort((a, b) => a.seriesIndex - b.seriesIndex);

          const entries = parms
            .map((ent) => {
              const { color, value, seriesIndex } = ent;
              const varIndex = Math.floor(seriesIndex / 3);
              const varName = varList[varIndex];
              const [minInd, maxInd, meanInd, stdDevInd] =
                getIndexVals(varName);
              const [climMeanInd, climStdDevInd] = getIndexVals(varName, true);

              const yLabel = axisLabels[varIndex];
              const minValue = isNaN(value[minInd])
                ? '--'
                : MiscUtil.round(value[minInd], 5);
              const maxValue = isNaN(value[maxInd])
                ? '--'
                : MiscUtil.round(value[maxInd], 5);
              const meanValue = isNaN(value[meanInd])
                ? '--'
                : MiscUtil.round(value[meanInd], 5);
              // const stdDevValue = isNaN(value[stdDevInd])
              //   ? '--'
              //   : MiscUtil.round(value[stdDevInd], 5);

              const climMean = isNaN(climVals[climMeanInd])
                ? '--'
                : MiscUtil.round(climVals[climMeanInd], 5);
              const climStdDev = isNaN(climVals[climStdDevInd])
                ? '--'
                : MiscUtil.round(climVals[climStdDevInd], 5);

              return `
                  <div style="display: flex; flex-flow: column nowrap; flex: 1 1; padding-bottom: 2px; margin-bottom: 2px; border-bottom: 1px solid #CCC;">
                    <div style="display: flex; flex-flow: row nowrap;">
                      <div style="flex-basis 20px; width: 20px; padding: 4px;">
                          <div style="display: block; border-radius: 50%; width: 10px; height: 10px; background: ${color}"></div>
                      </div>
                      <div style="flex: 1 1; font-weight: bold;">${yLabel}</div>
                    </div>
                    <div style="display: flex; flex-flow: row nowrap; padding-left: 20px;">
                      <div style="flex: 1 1; font-weight: bold;">Mean</div>
                      <div style="flex-basis: 1 1; font-family: monospace; text-align: right; padding-left: 8px;">${meanValue}</div>
                    </div>
                    <div style="display: flex; flex-flow: row nowrap; padding-left: 20px;">
                      <div style="flex: 1 1; font-weight: bold;">Range</div>
                      <div style="flex-basis: 1 1; font-family: monospace; text-align: right; padding-left: 8px;">${minValue} to ${maxValue}</div>
                    </div>
                    <div style="display: flex; flex-flow: row nowrap; padding-left: 20px;">
                      <div style="flex: 1 1; font-weight: bold;">Climatology</div>
                      <div style="flex-basis: 1 1; font-family: monospace; text-align: right; padding-left: 8px;">${climMean} ± ${climStdDev}</div>
                    </div>
                  </div>
                `;
            })
            .join('');

          return `
              <div style="display: flex; flex-flow: column nowrap;">
                <div style="display: flex; flex-flow: row nowrap; flex: 1 1; padding-bottom: 2px; margin-bottom: 2px; border-bottom: 1px solid #FFF;">
                  <div style="flex: 1 1; font-weight: bold;">Time</div>
                  <div style="flex: 1 1; font-family: monospace; text-align: right; padding-left: 8px;">${MiscUtil.formatDate(
                    new Date(datetime)
                  )}</div>
                </div>
                ${entries}
              </div>
              `;
        },
      },
      axisPointer: {
        link: { xAxisIndex: 'all' },
        label: {
          formatter: (parms) =>
            parms.axisDimension === 'x'
              ? this._dateFormatter(parms.value)
              : this._stdFormatter.format(parms.value),
        },
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      dataZoom: [
        {
          id: 'dataZoomX',
          type: 'slider',
          xAxisIndex: varList.map((v, i) => i),
          height: 20,
          // minValueSpan: 3600 * 24 * 1000, // one day
        },
      ],
      grid: varList.map((v, i) => {
        const prop = 1 / varList.length;
        const sep = 4; // 4% separation between charts
        const height = (84 - (sep * varList.length - 1)) * prop; // total height should be 80%
        const offset = height * i + sep * i + 8; // keep 10% at the top
        return {
          left: '6%',
          width: '90%',
          top: `${offset}%`,
          height: `${height}%`,
          borderWidth: 1,
          show: true,
        };
      }),
      xAxis: varList.map((v, i) => {
        const show = i === varList.length - 1;
        return {
          name: '',
          nameLocation: 'center',
          position: 'bottom',
          nameGap: 25,
          scale: true,
          type: 'time',
          gridIndex: i,
          alignTicks: true,
          show,
          axisLine: {
            onZero: false,
          },
          axisTick: {
            inside: true,
          },
          axisLabel: {
            formatter: this._dateFormatter,
          },
          nameTextStyle: { color: 'black', fontWeigt: 'bold' },
        };
      }),
      yAxis: axisLabels.map((v, i) => {
        return {
          name: v,
          type: 'value',
          nameLocation: 'end',
          position: 'left',
          nameGap: 3,
          // axisLine: { onZero: false },
          scale: true,
          gridIndex: i,
          axisLabel: {
            formatter: this._stdFormatter.format,
            verticalAlignMaxLabel: 'top',
          },
          nameTextStyle: { color: 'black', fontWeigt: 'bold', align: 'left' },
        };
      }),
      dataset: [
        {
          source: dfData.values,
          dimensions: dfData.columns.map((x) => {
            return {
              name: x,
              type:
                x.indexOf('datetime') >= 0
                  ? 'time'
                  : x === 'anom_id'
                  ? 'int'
                  : 'float',
            };
          }),
        },
        {
          source: climData.values,
          dimensions: climData.columns.map((x) => {
            return {
              name: x,
              type:
                x.indexOf('datetime') >= 0
                  ? 'time'
                  : x === 'anom_id'
                  ? 'int'
                  : 'float',
            };
          }),
        },
      ],
      series: varList.reduce((acc, v, i) => {
        acc.push({
          type: 'line',
          xAxisIndex: i,
          yAxisIndex: i,
          datasetIndex: 1,
          encode: {
            x: xAxis,
            y: `${v}_mean_minus_std_dev`,
          },
          lineStyle: {
            opacity: 0,
          },
          symbol: 'none',
          z: 1,
          silent: true,
          emphasis: {
            disabled: true,
          },
          tooltip: { show: false },
          stack: `${v}_confidence-band`,
        });
        acc.push({
          type: 'line',
          xAxisIndex: i,
          yAxisIndex: i,
          datasetIndex: 1,
          encode: {
            x: xAxis,
            y: `${v}_double_std_dev`,
          },
          lineStyle: {
            opacity: 0,
          },
          symbol: 'none',
          areaStyle: {
            color: '#ccc',
          },
          z: 1,
          silent: true,
          emphasis: {
            disabled: true,
          },
          tooltip: { show: false },
          stack: `${v}_confidence-band`,
        });
        acc.push({
          type: 'custom',
          renderItem: getRenderItem(v),
          blendMode: 'source-over',
          progressiveThreshold: 1,
          // progressive: 2000,
          large: true,
          xAxisIndex: i,
          yAxisIndex: i,
          datasetIndex: 0,
          encode: {
            x: xAxis,
            y: [`${v}_min`, `${v}_max`],
          },
        });

        return acc;
      }, []),
    };

    return chartOpts;
  }

  initChartControls(options) {
    const { anomalyMetadata, chartNodeIdSet, minDate, maxDate, varList } =
      options;
    const {
      chartId,
      chartTableId,
      chartSelectStartDateId,
      chartSelectEndDateId,
      chartStatsScatterScaleXExprId,
      chartStatsScatterScaleYExprId,
    } = chartNodeIdSet;

    // format data for the table
    const tableData = Object.keys(anomalyMetadata)
      .sort()
      .map((id) => {
        anomalyMetadata[id].startDate = MiscUtil.formatDate(
          new Date(anomalyMetadata[id].startDate)
        );
        anomalyMetadata[id].endDate = MiscUtil.formatDate(
          new Date(anomalyMetadata[id].endDate)
        );
        return anomalyMetadata[id];
      });

    // initialize the table
    const dataTable = new DataTable(`#${chartTableId}`, {
      paging: false,
      searching: false,
      scrollCollapse: true,
      scrollY: '300px',
      fixedColumns: true,
      columns: [
        { data: 'anomalyId', className: 'text-left' },
        { data: 'startDate', className: 'text-center' },
        { data: 'endDate', className: 'text-center' },
      ],
      columnDefs: [
        // Center align both header and body content of columns 1, 2 & 3
        { className: 'dt-head-center', targets: [0, 1, 2] },
        { width: '40%', targets: [1, 2] },
      ],
      data: tableData,
    });

    // enable multiple selection
    dataTable.on('click', 'tbody tr', (e) => {
      e.currentTarget.classList.toggle('selected');
    });

    // init date selectors
    const minDateSelect = new Date(minDate);
    const maxDateSelect = new Date(maxDate);
    $(`#${chartSelectStartDateId}`).flatpickr({
      enableTime: true,
      time_24hr: true,
      dateFormat: 'Y-m-d H:i',
      defaultDate: minDateSelect,
      minuteIncrement: 15,
      minDate: minDateSelect,
      maxDate: maxDateSelect,
    });
    $(`#${chartSelectEndDateId}`).flatpickr({
      enableTime: true,
      time_24hr: true,
      dateFormat: 'Y-m-d H:i',
      defaultDate: maxDateSelect,
      minuteIncrement: 15,
      minDate: minDateSelect,
      maxDate: maxDateSelect,
    });

    // store data table for future use
    this._chartStore[chartId].dataTable = dataTable;
    this._chartStore[chartId].minDate = minDateSelect;
    this._chartStore[chartId].maxDate = maxDateSelect;

    // init custom stats chart selections
    $(`#${chartStatsScatterScaleXExprId}`).val(`{${varList[0]}_mean}`);
    $(`#${chartStatsScatterScaleYExprId}`).val(`{${varList[1]}_mean}`);

    // build list of available axes
    // let axesOpts  = varList.reduce((acc, varStr) => {
    //   return acc.concat(['mean', 'std_dev', 'min', 'max'].map((ent) => `${varStr}_${ent}`))
    // }, []);
    // axesOpts = `<div>${axesOpts.join("<br/>")}</div>`
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

  createChartNode(isClimatologyChart) {
    // create a bunch of node identifiers
    const chartId = MiscUtil.getRandId(8);
    const chartParentId = `chart_container_${chartId}`;
    const chartNodeId = `chart_${chartId}`;
    const chartControlsId = `chart_controls_${chartId}`;
    const chartTableId = `chart_anomaly_table_${chartId}`;
    const chartSelectStartDateId = `chart_select_startdate_${chartId}`;
    const chartSelectEndDateId = `chart_select_enddate_${chartId}`;
    const chartStatsScatterScaleXExprId = `chart_select_custom_expr_x_${chartId}`;
    const chartStatsScatterScaleYExprId = `chart_select_custom_expr_y_${chartId}`;
    const chartSelectClimBinSizeId = `stats_clim_bin_size_${chartId}`;
    const chartSelectClimChunkTypeId = `stats_clim_chunk_type_${chartId}`;
    const chartSelectClimSkipStepSizeId = `stats_clim_skip_step_size_${chartId}`;
    const chartSelectDataPointBinSizeId = `stats_data_point_bin_size_${chartId}`;
    const chartsStatsVariableListId = `chart_vars_${chartId}`;

    // TODO - add the actual variable strings to the hint

    const dims = document
      .getElementById('vis_main-wrapper')
      .getBoundingClientRect();

    const idSet = {
      chartId,
      chartParentId,
      chartNodeId,
      chartControlsId,
      chartTableId,
      chartSelectStartDateId,
      chartSelectEndDateId,
      chartStatsScatterScaleXExprId,
      chartStatsScatterScaleYExprId,
      chartSelectClimBinSizeId,
      chartSelectClimChunkTypeId,
      chartSelectClimSkipStepSizeId,
      chartSelectDataPointBinSizeId,
    };

    // create new dom node
    const newChartStr = `
        <div id="${chartParentId}" class="vis_chart-node-wrapper" style="height: ${
      dims.height
    }px;">
            <div style="flex: 1 1; height: 100%; padding: 0px 36px 0px 8px; display: flex; flex-flow: row nowrap;">
                  <div id="${chartNodeId}" style="width: 100%; height: 100%;"></div>
            </div>    
            ${
              isClimatologyChart
                ? this.getStatsDataTimeseriesMenuNode(idSet)
                : this.getStatsDataScatterMenuNode(idSet)
            }
        </div>
    `;

    // add nodes into the dom
    $('#charts_list').append(newChartStr);

    return idSet;
  }

  getStatsDataScatterMenuNode(options) {
    const {
      chartId,
      chartControlsId,
      chartTableId,
      chartSelectStartDateId,
      chartSelectEndDateId,
      chartStatsScatterScaleXExprId,
      chartStatsScatterScaleYExprId,
    } = options;
    return `
        <div id="${chartControlsId}" class="vis_chart-controls-menu" style="flex-basis: 40%; width: 40%; height: 100%; display: flex; flex-flow: row nowrap; background: white; padding-left: 8px; border-left: 1px solid #AAA;">
          <div style="flex-basis: 24px; width: 24px; cursor: pointer; padding-top: 17px;" onclick="_glob_chartUtil.toggleMenu('${chartId}')">
              [-]
          </div>
          <div style="flex: 1 1; display: flex; flex-flow: column; padding: 8px 0px;">
             <div style="display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center;">
              <div style="font-size: 16px; font-weight: bold; padding: 8px;">Adjust Chart Options</div>
              <div style="text-align: right;">
                  <input type="button" value="Remove" onClick="_glob_chartUtil.removeChart('${chartId}')" />
                  <input type="button" value="Reset" onClick="_glob_chartUtil.resetChart('${chartId}')" />
                  <input type="button" value="Update" onClick="_glob_chartUtil.updateChart('${chartId}')" />
              </div>
            </div>
            <div style="flex: 1 1; padding: 0px 0px 0px 8px; overflow: hidden; overflow-y: auto;">
              <div style="overflow: hidden; display: flex; flex-flow: column;">
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
                      <input type="button" value="None" onClick="_glob_chartUtil.clearAllAnomalies('${chartId}')" />
                      <input type="button" value="All" onClick="_glob_chartUtil.selectAllAnomalies('${chartId}')" />
                  </div>
              </div>
              <div style="flex-basis: 40px; height: 40px; display: flex; flex-flow: row nowrap; padding: 4px 0px;">
                  <div style="flex: 1 1; display: flex; justify-content: flex-start; align-items: center; padding-right: 16px;">
                      <label for="${chartSelectStartDateId}" style="padding-right: 4px;">Start Date</label>
                      <input id="${chartSelectStartDateId}" name="${chartSelectStartDateId}" placeholder="yyyy-mm-dd" style="flex: 1 1;" />
                  </div>
                  <div style="flex: 1 1; display: flex; justify-content: flex-end; align-items: center;">
                      <label for="${chartSelectEndDateId}" style="padding-right: 4px;">End Date</label>
                      <input id="${chartSelectEndDateId}" name="${chartSelectEndDateId}" placeholder="yyyy-mm-dd" style="flex: 1 1;" />
                  </div>
              </div>
              <div style="flex: 1 1; display: block; padding: 4px 0px;">
                  <div style="font-size: 14px; font-weight: bold; padding: 8px 0px 4px 0px;">Statistics Scatter Chart</div>
                  <div style="font-size: 12px; padding: 4px 0px 2px 0px;">Variables: {mean, std_dev, min, max} or {datetime} Operators: {+, -, *, /, ^}</div>
                  <div style="font-size: 12px; padding: 2px 0px 8px 0px;">Example expression: 2 * {precipitation_mean} + {TQV_mean} / 2</div>
                  <div style="display: flex; justify-content: flex-start; align-items: center; margin-bottom: 4px;">
                      <label for="${chartStatsScatterScaleXExprId}" style="padding-right: 4px; flex-basis: 25%; width: 25%;">X Series</label>
                      <input id="${chartStatsScatterScaleXExprId}" name="${chartStatsScatterScaleXExprId}" placeholder="_mean" style="flex: 1 1;" />
                  </div>
                  <div style="display: flex; justify-content: flex-end; align-items: center;">
                      <label for="${chartStatsScatterScaleYExprId}" style="padding-right: 4px; flex-basis: 25%; width: 25%;">Y Series</label>
                      <input id="${chartStatsScatterScaleYExprId}" name="${chartStatsScatterScaleYExprId}" placeholder="_mean" style="flex: 1 1;" />
                  </div>
              </div>
          </div>
      </div>
    `;
  }

  getStatsDataTimeseriesMenuNode(options) {
    const {
      chartId,
      chartControlsId,
      chartSelectDataPointBinSizeId,
      chartSelectClimBinSizeId,
      chartSelectClimChunkTypeId,
      chartSelectClimSkipStepSizeId,
    } = options;

    // TODO format this sensibly
    return `
        <div id="${chartControlsId}" class="vis_chart-controls-menu" style="flex-basis: 40%; width: 40%; height: 100%; display: flex; flex-flow: row nowrap; background: white; padding-left: 8px; border-left: 1px solid #AAA;">
          <div style="flex-basis: 24px; width: 24px; cursor: pointer; padding-top: 17px;" onclick="_glob_chartUtil.toggleMenu('${chartId}')">
              [-]
          </div>
          <div style="flex: 1 1; display: flex; flex-flow: column; padding: 8px 0px;">
              <div style="font-size: 16px; font-weight: bold; padding: 8px;">Adjust Chart Options</div>
            <div style="display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center;">
              <div style="font-size: 16px; font-weight: bold; padding: 8px;">Adjust Chart Options</div>
              <div style="text-align: right;">
                  <input type="button" value="Remove" onClick="_glob_chartUtil.removeChart('${chartId}')" />
                  <input type="button" value="Reset" onClick="_glob_chartUtil.resetChart('${chartId}')" />
                  <input type="button" value="Update" onClick="_glob_chartUtil.updateChart('${chartId}')" />
              </div>
            </div>
            <div style="flex: 1 1; padding: 0px 0px 0px 8px; overflow: hidden; overflow-y: auto;">
              <div class="vis_labeled-select-small">
                <label for="${chartSelectDataPointBinSizeId}" class="lbold12" style="width: auto; flex: 1 1;">Data Point Binning</label>
                <select class="normal10 vis_btn" id="${chartSelectDataPointBinSizeId}" name="${chartSelectDataPointBinSizeId}" style="flex-basis: 30%; width: 30%;">
                  <option selected value="day">None</option>
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>  
              <div class="vis_labeled-select-small">
                <label for="${chartSelectClimBinSizeId}" class="lbold12" style="width: auto; flex: 1 1;">Climatology Bin Size</label>
                <select class="normal10 vis_btn" id="${chartSelectClimBinSizeId}" name="${chartSelectClimBinSizeId}" style="flex-basis: 30%; width: 30%;">
                  <option value="day">Day</option>
                  <option selected value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>
              <div class="vis_labeled-select-small">
                <label for="${chartSelectClimChunkTypeId}" class="lbold12" style="width: auto; flex: 1 1;">Climatology Bin Type</label>
                <select class="normal10 vis_btn" id="${chartSelectClimChunkTypeId}" name="${chartSelectClimChunkTypeId}" style="flex-basis: 30%; width: 30%;">
                  <option selected value="standard">Standard</option>
                  <option value="rolling">Rolling</option>
                  <option value="skip_step">Skip Step</option>
                </select>
              </div>
              <div class="vis_labeled-select-small">
                <label for="${chartSelectClimSkipStepSizeId}" class="lbold12" style="width: auto; flex: 1 1;">Skip Size</label>
                <input id="${chartSelectClimSkipStepSizeId}" name="${chartSelectClimSkipStepSizeId}" style="flex-basis: 30%; width: 30%;" type="number" placeholder="0">
              </div>
              <div class="vis_timeseries_info">
                The timeseries plots visualize the following values:
                <ol style="list-style: auto; padding: revert;">
                  <li>Bin Size Mean (aggregated from the sub-daily mean values)</li>
                  <li>Bin Size Max (max value from the sub-daily max values)</li>
                  <li>Bin Size Min (min value from the sub-daily min values)</li>
                  <li>Climatology mean (mean of the means in the climatology bin)</li>
                  <li>Climatology std dev (std dev of the means in the climatology bin)</li>
                </ol>
                These values are represented by:
                <ul style="list-style: auto; padding: revert;">
                  <li>A colored circle for the mean (1)</li>
                  <li>A black vertical bar spanning the min (3) and the max (4) values</li>
                  <li>A grey area spanning the climatology mean (4) +/- the climatology std dev (5)</li>
                </ul>
              </div>
            </div>
        </div>
    `;
  }

  resetChart(chartId) {
    const { idSet, minDate, maxDate } = this._chartStore[chartId];
    const {
      chartSelectStartDateId,
      chartSelectEndDateId,
      chartStatsScatterScaleXExprId,
      chartStatsScatterScaleYExprId,
    } = idSet;

    // reset dates
    const sDateInput = $(`#${chartSelectStartDateId}`)[0]._flatpickr;
    const eDateInput = $(`#${chartSelectEndDateId}`)[0]._flatpickr;
    sDateInput.setDate(minDate);
    eDateInput.setDate(maxDate);

    // clear selections
    this.clearAllAnomalies(chartId);

    // clear custom stats
    $(`#${chartStatsScatterScaleXExprId}`).val('');
    $(`#${chartStatsScatterScaleYExprId}`).val('');

    // refresh the chart
    this.updateChart(chartId);
  }

  toggleMenu(chartId) {
    const { idSet } = this._chartStore[chartId];
    const { chartControlsId } = idSet;

    $(`#${chartControlsId}`)[0].classList.toggle('vis_open');
  }

  updateChart(chartId) {
    const { charts, dataTable, dataPkg, idSet, isClimatologyChart } =
      this._chartStore[chartId];
    const { stats: statsChart } = charts;
    const { data: dfData, axisLabels, minDate, maxDate } = dataPkg;
    const {
      chartSelectStartDateId,
      chartSelectEndDateId,
      chartStatsScatterScaleXExprId,
      chartStatsScatterScaleYExprId,
      chartSelectClimBinSizeId,
      chartSelectClimChunkTypeId,
      chartSelectClimSkipStepSizeId,
      chartSelectDataPointBinSizeId,
    } = idSet;

    statsChart.showLoading();

    dfData.resetIndex({ inplace: true });

    const opts = {};

    let dfDataCustom = dfData;
    if (isClimatologyChart) {
      // parse out climatology options
      const chartSelectDataPointBinSize = document.getElementById(
        `${chartSelectDataPointBinSizeId}`
      ).value; // day, week, month, year
      const chartSelectClimBinSize = document.getElementById(
        `${chartSelectClimBinSizeId}`
      ).value; // day, week, month, year
      const chartSelectClimChunkType = document.getElementById(
        `${chartSelectClimChunkTypeId}`
      ).value; // standard, rolling, skip_step
      const chartSelectSkipStepSize = document.getElementById(
        `${chartSelectClimSkipStepSizeId}`
      ).value; // 1,2,3,...

      // prep options for generating the climatology
      opts['climatology'] = {
        dataFrame: dfDataCustom,
        resolution: chartSelectClimBinSize,
        type: chartSelectClimChunkType,
        skip_step: parseFloat(chartSelectSkipStepSize),
      };
    } else {
      // parse out date from selectors
      let sDate = minDate;
      let eDate = maxDate;
      const sDateInput = $(`#${chartSelectStartDateId}`)[0]._flatpickr;
      const eDateInput = $(`#${chartSelectEndDateId}`)[0]._flatpickr;
      if (sDateInput) {
        const sDateVal = sDateInput.selectedDates[0];
        sDate = sDateVal.getTime();
      }
      if (eDateInput) {
        const eDateVal = eDateInput.selectedDates[0];
        eDate = eDateVal.getTime();
      }

      // filter to selections
      let dfDataFiltered = dfData.query(
        dfData['datetime'].ge(sDate).and(dfData['datetime'].le(eDate))
      );

      // get selected anomaly IDs
      const selectedIds = [];
      dataTable.rows('.selected').every(function () {
        const rowData = this.data();
        selectedIds.push(rowData.anomalyId);
      });

      if (selectedIds.length > 0) {
        dfDataFiltered = dfDataFiltered.loc({
          rows: dfDataFiltered['anom_id'].values.map((x) =>
            selectedIds.includes(x)
          ),
        });
      }

      // generate custom series
      const statsScatterCustomExprX = $(`#${chartStatsScatterScaleXExprId}`)[0]
        .value;
      const statsScatterCustomExprY = $(`#${chartStatsScatterScaleYExprId}`)[0]
        .value;
      const varAxisMap = dfData.columns.reduce((acc, col, ind) => {
        const mapStr = `var${ind + 1}`;
        acc[mapStr] = col;
        return acc;
      }, {});

      dfDataCustom = dfDataFiltered;
      if (statsScatterCustomExprX) {
        const customSeriesX = this._dataUtil.applyExprToDataFrame({
          dataFrame: dfDataFiltered,
          axisMap: varAxisMap,
          expr: statsScatterCustomExprX,
        });
        dfDataCustom = dfDataCustom.addColumn(
          statsScatterCustomExprX,
          customSeriesX
        );
      }

      if (statsScatterCustomExprY) {
        const customSeriesY = this._dataUtil.applyExprToDataFrame({
          dataFrame: dfDataFiltered,
          axisMap: varAxisMap,
          expr: statsScatterCustomExprY,
        });

        dfDataCustom = dfDataCustom.addColumn(
          statsScatterCustomExprY,
          customSeriesY
        );
      }

      opts['customX'] = statsScatterCustomExprX || undefined;
      opts['customY'] = statsScatterCustomExprY || undefined;
    }

    // create new object with filtered data
    const filteredDataPkg = {
      ...dataPkg,
      data: dfDataCustom,
    };

    // collect new option sets and update charts
    const statsChartOpts = this.getChartOpts(filteredDataPkg, {
      isClimatologyChart,
      ...opts,
    });
    statsChart.setOption(statsChartOpts, { notMerge: true });
    statsChart.hideLoading();

    // console.log('updated package', filteredDataPkg);
  }

  removeChart(chartId) {
    if (this._chartStore[chartId]) {
      const { charts, idSet } = this._chartStore[chartId];
      const { chartParentId } = idSet;

      if (charts) {
        for (const key in charts) {
          echarts.dispose(charts[key]);
        }
      }

      $(`#${chartParentId}`).remove();

      this._chartStore[chartId] = null;
      delete this._chartStore[chartId];
    } else {
      console.warn(`Cannot remove chart: ${chartId}`);
    }
  }

  clearAndShowError(chartId) {
    if (this._chartStore[chartId]) {
      const { idSet } = this._chartStore[chartId];
      const { chartParentId } = idSet;

      const errorContent = `
          <div class="vis_chart-error-content">
              <div class="vis_chart-error-text">
                  <div class="vis_chart-error-title">Charting Error</div>
                  <div class="vis_chart-error-subtext">Failed to generate chart. Please adjust your selections or try again later.</div>
              </div>
              <div class="vis_chart-error-clear">
                  <input type="button" value="Remove" onClick="_glob_chartUtil.removeChart('${chartId}')" />
              </div>
          </div>
      `;

      $(`#${chartParentId}`).css({ height: 'auto' });
      $(`#${chartParentId}`).html(errorContent);
    }
  }
}

class MapUtil {
  constructor(nodeId) {
    this._nodeId = nodeId;

    this._map = this.initMap(this._nodeId);
    this._timeStepIdx = 0;
    this._animateInterval = undefined;
    this._fetchingPoly = false;
  }

  initMap(nodeId) {
    // init basic map
    const map = L.map(nodeId, {
      minZoom: 0,
      maxZoom: 11,
    }).setView([0, 0], 2);

    // add base layers
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // add draw layers/tools
    this._drawnItems = new L.FeatureGroup();
    map.addLayer(this._drawnItems);
    var drawControlFull = new L.Control.Draw({
      draw: {
        polygon: false,
        rectangle: true,
        marker: false,
        circle: false,
        polyline: false,
      },
      edit: {
        featureGroup: this._drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControlFull);

    var drawControlEditOnly = new L.Control.Draw({
      edit: {
        featureGroup: this._drawnItems,
      },
      draw: false,
    });

    // add event tracking
    map.on(L.Draw.Event.CREATED, (evt) => {
      const { layer } = evt;
      this._drawnItems.addLayer(layer);
      drawControlFull.remove(map);
      drawControlEditOnly.addTo(map);
    });

    map.on(L.Draw.Event.DELETED, (evt) => {
      if (this._drawnItems.getLayers().length === 0) {
        drawControlEditOnly.remove(map);
        drawControlFull.addTo(map);
      }
    });

    // add hover control
    const info = L.control();

    info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'vis_map-info'); // create a div with a class "info"
      this.update();
      return this._div;
    };

    info.update = function (props) {
      this._div.innerHTML = `<div class="vis_map-info-label">Anomaly</div><div class="vis_map-info-value">${
        props ? props.anomaly : '-'
      }</div>`;
    };

    info.addTo(map);
    this._mapInfoBox = info;

    return map;
  }

  getDrawnBounds() {
    const l = this._drawnItems.getLayers()[0];
    if (l) {
      const latLngs = l.getLatLngs()[0];
      const bounds = latLngs.reduce(
        (acc, el) => {
          acc[0] = Math.min(el.lng, acc[0]);
          acc[1] = Math.min(el.lat, acc[1]);
          acc[2] = Math.max(el.lng, acc[2]);
          acc[3] = Math.max(el.lat, acc[3]);
          return acc;
        },
        [
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          Number.NEGATIVE_INFINITY,
          Number.NEGATIVE_INFINITY,
        ]
      );
      return bounds;
    }
  }

  findLayers(options) {
    const { key, value } = options;
    const layers = [];
    this._map.eachLayer((l) => {
      if (l.options[key] === value) {
        layers.push(l);
      }
    });
    return layers;
  }

  getPolyStyle(anomalyId) {
    if (_glob_jobUtil.isAnomalySelected(anomalyId)) {
      return this.getHighlightPolyStyle();
    }
    return this.getDefaultPolyStyle();
  }

  getDefaultPolyStyle() {
    return {
      fillColor: '#FFFFFF',
      fillOpacity: 0.25,
      color: '#000000',
      weight: 1,
    };
  }

  getHighlightPolyStyle() {
    return {
      fillColor: '#FFFFFF',
      fillOpacity: 0.75,
      color: '#000000',
      weight: 3,
    };
  }

  highlightFeature(layer) {
    layer.setStyle(this.getHighlightPolyStyle());

    layer.bringToFront();
  }

  resetHighlight(layer) {
    const { anomaly } = layer.feature.properties;
    if (!_glob_jobUtil.isAnomalySelected(anomaly)) {
      layer.setStyle(this.getDefaultPolyStyle());
    }
  }

  zoomToFeature(feat) {
    this._map.fitBounds(feat.getBounds());
  }

  highlightMatchingFeatures(options) {
    const { layerKey, layerValue, reset = false } = options;

    const layers = this.findLayers({ key: layerKey, value: layerValue });
    layers.forEach((l) => {
      if (reset) {
        this.resetHighlight(l);
      } else {
        this.highlightFeature(l);
      }
    });
  }

  mouseOverFeature(layer) {
    this.highlightMatchingFeatures({
      layerKey: '_id',
      layerValue: layer.options._id,
    });
    this._mapInfoBox.update(layer.feature.properties);
  }

  mouseOutFeature(layer) {
    this.highlightMatchingFeatures({
      layerKey: '_id',
      layerValue: layer.options._id,
      reset: true,
    });
    this._mapInfoBox.update();
  }

  clickFeature(layer) {
    const { anomaly: anomalyId } = layer.feature.properties;
    const selected = _glob_jobUtil.isAnomalySelected(anomalyId);
    _glob_jobUtil.selectAnomalyId(anomalyId, !selected);
    _glob_jobUtil.selectTableRowById(anomalyId, !selected);
  }

  initFeature() {
    return (feature, layer) => {
      const { anomaly } = feature.properties;
      layer.options._id = `${layer.options._group}_${anomaly}`;
      layer.on({
        mouseover: (e) => this.mouseOverFeature(e.target),
        mouseout: (e) => this.mouseOutFeature(e.target),
        click: (e) => this.clickFeature(e.target),
      });
      if (_glob_jobUtil.isAnomalySelected(anomaly)) {
        this.highlightFeature(layer);
      }
    };
  }

  clearLayer(options) {
    const layers = this.findLayers(options);
    layers.forEach((l) => this._map.removeLayer(l));
  }

  addPoly(options) {
    const {
      coords,
      color = '#000000',
      fill = false,
      weight = 1,
      zoomTo = true,
      customOpts = {},
    } = options;

    // create an orange rectangle
    const poly = L.polygon(coords, {
      color,
      fill,
      weight,
      ...customOpts,
    }).addTo(this._map);

    // zoom the map to the bounds
    if (zoomTo) {
      this._map.fitBounds(poly.getBounds());
    }
  }

  addPolySet(options) {
    const { polySet, customOpts = {} } = options;

    L.geoJSON(polySet, {
      style: this.getDefaultPolyStyle(),
      onEachFeature: this.initFeature(),
      ...customOpts,
    }).addTo(this._map);
  }

  setTimePolyByIdx(idx) {
    const { files } = _glob_jobUtil.getCurrJob();
    const { polyFiles } = files;
    if (idx >= 0 && idx < polyFiles.length) {
      this.setTimePoly(polyFiles[idx]);
      this._timeStepIdx = idx;
    } else {
      console.warn('Bad poly index', idx);
    }
  }

  setTimePolyByName(name) {
    const { files } = _glob_jobUtil.getCurrJob();
    const { polyFiles } = files;
    const idx = polyFiles.indexOf(name);
    if (idx !== -1 && idx !== this._timeStepIdx) {
      this.setTimePolyByIdx(idx);
    } else {
      console.warn('Poly file not found', name);
    }
  }

  async setTimePoly(polyFile) {
    this._fetchingPoly = true;
    try {
      const appRoot = MiscUtil.getURI();
      const { id: jobId } = _glob_jobUtil.getCurrJob();
      const polySet = await MiscUtil.fetchJson(
        `${appRoot}/GetJsonByKey.php?key=${polyFile}`
      );
      this.clearLayer({ key: '_type', value: 'anom_poly_set' });
      this.addPolySet({
        polySet,
        customOpts: { _group: `poly_set_${jobId}`, _type: 'anom_poly_set' },
      });
      document.getElementById('map_time-select').value = polyFile;
    } catch (err) {
      console.warn('Failed to add poly', err);
    }
    this._fetchingPoly = false;
  }

  stepTimePoly(forward) {
    const { files } = _glob_jobUtil.getCurrJob();
    const { polyFiles } = files;
    let nextIdx = forward ? this._timeStepIdx + 1 : this._timeStepIdx - 1;
    if (nextIdx >= polyFiles.length) {
      nextIdx = 0;
    } else if (nextIdx < 0) {
      nextIdx = polyFiles.length - 1;
    }
    this.setTimePolyByIdx(nextIdx);
  }

  playPauseTimePoly() {
    // currently playing
    if (this._animateInterval) {
      clearInterval(this._animateInterval);
      this._animateInterval = undefined;
    } else {
      this._animateInterval = setInterval(() => {
        if (!this._fetchingPoly) this.stepTimePoly(true);
      }, 1000);
    }
  }
}
