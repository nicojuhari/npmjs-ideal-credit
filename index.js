const createGrafic = (
    sum,
    period,
    interest,
    {
        startDate = formatDate(new Date()),
        creditRatesToPay = 0,
        desiredCreditRate = 0,
        desiredTotalRate = 0,
        desiredStartRate = 0,
        desiredStartDateToPay = "",
    } = {}
) => {
    let rata = {};
    let grafic = [];
    let termenCredit = 0;
    let totalInsertedRates = 0;
    let creditRata = 0;
    let totalRata = 0;
    desiredCreditRate = Number(desiredCreditRate);
    desiredTotalRate = Number(desiredTotalRate);
    // calc in cite luni se achita credit
    termenCredit = creditRatesToPay || period;
    // calc credit rata
    if (desiredCreditRate > 0 && (desiredTotalRate == 0 || !desiredTotalRate)) {
        creditRata = desiredCreditRate;
    } else {
        creditRata = Math.round(sum / termenCredit);
    }
    for (var i = 0; i < Number(period); i++) {
        rata = {
            nr_rata: 0,
            data_rata: "",
            credit_rata: 0,
            dobinda_rata: 0,
            total_rata: 0,
        };
        // nr rata - 0
        let nrRata = desiredStartRate + i + 1;
        //data rata - 1
        let dataRata = "";
        if (desiredStartDateToPay) {
            dataRata = formatDate(addMonths(i, desiredStartDateToPay));
        } else {
            dataRata = formatDate(addMonths(i + 1, startDate));
        }
        //interest din sold - 3
        let interestRata = Math.round(
            (Number(interest) * (Number(sum) - totalInsertedRates)) / 100
        );
        // if custom date exist , on first month
        if (desiredStartDateToPay && desiredStartDateToPay != startDate && i == 0) {
            let diffDays = daysBetween(startDate, dataRata);
            // //check id custom date is bigger than original rata date
            if (diffDays > 0) {
                interestRata = Math.round((interestRata / 30.5) * diffDays);
            }
        }
        //calc the credit rata, based on total rata dorita
        if (desiredTotalRate > 0 && desiredTotalRate >= interestRata) {
            creditRata = desiredTotalRate - interestRata;
        }
        //calc last rata credit - 2
        if (Number(period) == i + 1) creditRata = Number(sum) - totalInsertedRates;
        //total lunar - 4
        if (i >= Number(period) - termenCredit) {
            totalRata = creditRata + interestRata;
        } else {
            totalRata = interestRata;
        }
        //total Inserted Rates - for local only
        if (i >= Number(period) - termenCredit) {
            totalInsertedRates = totalInsertedRates + creditRata;
        }
        if (totalInsertedRates > Number(sum)) {
            alert("Suma Total Lunară este prea mare, incercati o suma mai mica");
            return [];
        }
        //0
        rata.nr_rata = nrRata;
        //1
        rata.data_rata = dataRata;
        //2
        if (i >= period - termenCredit) rata.credit_rata = creditRata; // else is 0, by default
        //3
        rata.dobinda_rata = interestRata;
        //4
        rata.total_rata = totalRata;
        //add one rata to grafic array
        grafic.push(rata);
    } //for
    //return
    return grafic;
};

const calcDAE = (grafic, loan, startDate = new Date()) => {
    //check if grafic is not null

    // loan = loan - comision if exist.
    if (grafic.length == 0) return;
    //new local vars
    let graficDataSuma = [];
    let dae = 0;
    //prepare grafic
    grafic.forEach((rata) => {
        graficDataSuma[rata.data_rata] = rata.total_rata;
    });
    //calc dae
    dae = daeCalculator(loan, startDate, graficDataSuma, 0.01) * 100;
    return dae.toFixed(2);
};

const todayDate = () => {
    return formatDate(new Date());
};

const formatDate = (d) => {
    let date = new Date(d);
    let dd = date.getDate();
    let mm = date.getMonth() + 1;
    let yyyy = date.getFullYear();
    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;
    return yyyy + "-" + mm + "-" + dd;
};

const addMonths = (value, d = "") => {
    if (!d) d = new Date();
    else d = new Date(d);
    let n = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + value);
    let res = d.setDate(Math.min(n, getDaysInMonth(d.getFullYear(), d.getMonth())));
    return res;
};

const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

const getDaysInMonth = (year, month) => {
    return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};

const daysBetween = (startDate, endDate) => {
    return Math.abs(new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000);
};

const daeCalculator = (principal, startDateString, payments, guess) => {
    let values = [-1 * principal];
    let days = [1];
    let startDate = new Date(startDateString);
    Object.keys(payments).forEach(function (date) {
        values.push(payments[date]);
        days.push(
            1 +
                Math.ceil(
                    Math.abs(new Date(date).getTime() - startDate.getTime()) / (1000 * 3600 * 24)
                )
        );
    });
    let fx = function (x) {
        let sum = 0;
        days.forEach(function (day, idx) {
            sum += values[idx] * Math.pow(1 + x, (days[0] - day) / 365);
        });
        return sum;
    };
    let fdx = function (x) {
        let sum = 0;
        days.forEach(function (day, idx) {
            sum +=
                (1 / 365) *
                (days[0] - day) *
                values[idx] *
                Math.pow(1 + x, (days[0] - day) / 365 - 1);
        });
        return sum;
    };
    return Math.abs(run(fx, fdx, guess));
};

const run = (fx, fdx, guess) => {
    let precision = 4;
    let errorLimit = Math.pow(10, -1 * precision);
    let previousValue = 0;
    do {
        guess = Number(guess);
        previousValue = Number(guess);
        guess = previousValue - Number(fx(guess)) / Number(fdx(guess));
    } while (Math.abs(guess - previousValue) > errorLimit);
    return guess;
};

module.exports = {
    createGrafic,
    calcDAE,
    todayDate,
    formatDate,
    addMonths,
}
