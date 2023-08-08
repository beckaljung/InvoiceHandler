const fs = require("fs");
const readline = require('readline');

function readStream() {
    const choosenYear = '2022';
    const monthsOfTheYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let montlyExposures = {};
    let month = 1;
    let currentExposure = 0;
    let monthsMaxExposure = 0;
    let corruptLines = 0;

    const inputStream = fs.createReadStream('./src/events.txt', {encoding: 'UTF-8'});
    const outputStream = fs.createWriteStream('./src/montlyExposures', {encoding: "utf8"});

    let lineReader = readline.createInterface({
        input: inputStream,
    });

    lineReader.on('line', function (event) {

        try {
            let invoice = JSON.parse(event);
            let timeStamp = invoice.timestamp.split("-");

            if ( parseFloat(invoice.amount) && new Date(invoice.timestamp) instanceof Date && timeStamp[0] == choosenYear) {

                if (Number(timeStamp[1]) > month) {
                    eval('montlyExposures.' + monthsOfTheYear[month - 1] + '= ' + monthsMaxExposure + ';')
                    monthsMaxExposure = currentExposure; // The start exposure (before the first invoice) for each month can be the max exposure. (otherwise set =0 here)
                    month++;
                }

                    switch (invoice.eventType) {
                        case 'InvoiceRegistered': {
                            currentExposure += Number(invoice.amount);
                            break;
                        }
                        case 'LateFeeRegistered': {
                            currentExposure += Number(invoice.amount);
                            break;
                        }
                        case 'PaymentRegistered': {
                            currentExposure -= Number(invoice.amount);
                            break;
                        }
                        default: {
                            corruptLines++;
                        }
                    };

                if (currentExposure > monthsMaxExposure) {
                    monthsMaxExposure = currentExposure;
                }
            }
            else {
                corruptLines++;
            }
        }
        catch (error) {
            corruptLines++;
        }
    });

    lineReader.on('close', function () {
        eval('montlyExposures.' + monthsOfTheYear[month - 1] + '= ' + monthsMaxExposure + ';')

        for (const m of Object.keys(montlyExposures)) {
            outputStream.write(`${m}:  ${montlyExposures[m]}` + '\n');
        }

        outputStream.write('\n' + 'Number of corrupt lines:' + corruptLines);
    });

};

module.exports = readStream;