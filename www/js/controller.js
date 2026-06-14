var app = angular.module('myApp', []);

app.controller('myCtrl', function ($scope, $http, $q) {

    // ---- Selection state -------------------------------------------------
    $scope.availableYears = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013];
    $scope.selectedYear = 2023;

    // World Bank country code + capital coords (for rainfall via Open-Meteo).
    $scope.countries = [
        { name: 'Pakistan', code: 'PK', lat: 33.69, lon: 73.06 },
        { name: 'India', code: 'IN', lat: 28.61, lon: 77.21 },
        { name: 'Bangladesh', code: 'BD', lat: 23.81, lon: 90.41 },
        { name: 'China', code: 'CN', lat: 39.90, lon: 116.40 },
        { name: 'United States', code: 'US', lat: 38.90, lon: -77.04 },
        { name: 'United Kingdom', code: 'GB', lat: 51.51, lon: -0.13 },
        { name: 'Germany', code: 'DE', lat: 52.52, lon: 13.40 },
        { name: 'France', code: 'FR', lat: 48.85, lon: 2.35 },
        { name: 'Japan', code: 'JP', lat: 35.68, lon: 139.69 },
        { name: 'Brazil', code: 'BR', lat: -15.79, lon: -47.88 },
        { name: 'Turkiye', code: 'TR', lat: 39.93, lon: 32.86 },
        { name: 'Saudi Arabia', code: 'SA', lat: 24.71, lon: 46.68 },
        { name: 'United Arab Emirates', code: 'AE', lat: 24.45, lon: 54.38 },
        { name: 'Indonesia', code: 'ID', lat: -6.21, lon: 106.85 },
        { name: 'Nigeria', code: 'NG', lat: 9.08, lon: 7.40 },
        { name: 'Egypt', code: 'EG', lat: 30.04, lon: 31.24 }
    ];
    $scope.selectedCountry = $scope.countries[0];

    // ---- Indicators (currency-agnostic so any country works) -------------
    // type drives both number formatting and how the YoY change is shown.
    var INDICATORS = [
        { key: 'gdp',          code: 'NY.GDP.MKTP.CD',    label: '💵 GDP',              group: 'main',   type: 'usd' },
        { key: 'population',   code: 'SP.POP.TOTL',       label: '👥 Population',       group: 'main',   type: 'num' },
        { key: 'externalDebt', code: 'DT.DOD.DECT.CD',    label: '🌍 External Debt',    group: 'main',   type: 'usd' },
        { key: 'taxRevenue',   code: 'GC.TAX.TOTL.GD.ZS', label: '💰 Tax Revenue',      group: 'main',   type: 'pct' },
        { key: 'healthExp',    code: 'SH.XPD.CHEX.GD.ZS', label: '🏥 Health Exp',       group: 'main',   type: 'pct' },
        { key: 'militaryExp',  code: 'MS.MIL.XPND.GD.ZS', label: '🪖 Military Exp',      group: 'main',   type: 'pct' },
        { key: 'revenue',      code: 'GC.REV.XGRT.GD.ZS', label: '🏦 Govt Revenue',     group: 'budget', type: 'pct' },
        { key: 'expense',      code: 'GC.XPN.TOTL.GD.ZS', label: '🧾 Govt Expenditure', group: 'budget', type: 'pct' },
        { key: 'deficit',      code: 'GC.NLD.TOTL.GD.ZS', label: '⚖️ Fiscal Balance',   group: 'budget', type: 'pct' }
    ];

    $scope.mainStats = [];
    $scope.budgetStats = [];
    $scope.dataLoaded = false;
    $scope.lastUpdated = '';
    $scope.rainfall = 'Loading...';

    // ---- Formatting helpers ---------------------------------------------
    function abbr(v) {
        var a = Math.abs(v);
        if (a >= 1e12) return (v / 1e12).toFixed(2) + 'T';
        if (a >= 1e9)  return (v / 1e9).toFixed(2) + 'B';
        if (a >= 1e6)  return (v / 1e6).toFixed(2) + 'M';
        return Math.round(v).toLocaleString();
    }
    function formatValue(type, v) {
        if (type === 'usd') return '$' + abbr(v);
        if (type === 'pct') return (+v).toFixed(2) + ' %';
        return abbr(v);
    }
    function yearTag(year) {
        return (year && year !== $scope.selectedYear) ? ' (' + year + ')' : '';
    }

    // Pick the value for the given year, else the latest non-null at/below it.
    function pickAtOrBefore(records, year) {
        var exact = records.find(function (r) { return r.date === String(year) && r.value !== null; });
        if (exact) return { value: exact.value, year: parseInt(exact.date, 10) };
        var fb = records.find(function (r) { return r.value !== null && parseInt(r.date, 10) <= year; });
        return fb ? { value: fb.value, year: parseInt(fb.date, 10) } : null;
    }

    // ---- Main loader -----------------------------------------------------
    $scope.getData = function () {
        $scope.dataLoaded = false;
        var country = $scope.selectedCountry;
        var promises = [];

        // Financial / population indicators
        INDICATORS.forEach(function (ind) {
            var url = 'https://api.worldbank.org/v2/country/' + country.code +
                '/indicator/' + ind.code + '?format=json&per_page=100';
            promises.push($http.get(url).then(function (res) {
                var records = (res.data && res.data[1]) || [];
                var cur = records.length ? pickAtOrBefore(records, $scope.selectedYear) : null;
                var stat = {
                    label: ind.label, type: ind.type,
                    valueStr: 'Not Available', yearTag: '', changeStr: '', dir: ''
                };
                if (cur) {
                    stat.valueStr = formatValue(ind.type, cur.value);
                    stat.yearTag = yearTag(cur.year);
                    var prev = pickAtOrBefore(records, cur.year - 1);
                    if (prev) {
                        if (ind.type === 'pct') {
                            var dpp = cur.value - prev.value;
                            stat.changeStr = (dpp >= 0 ? '+' : '') + dpp.toFixed(2) + ' pp';
                            stat.dir = dpp >= 0 ? 'up' : 'down';
                        } else {
                            var pc = (cur.value - prev.value) / Math.abs(prev.value) * 100;
                            stat.changeStr = (pc >= 0 ? '+' : '') + pc.toFixed(1) + '%';
                            stat.dir = pc >= 0 ? 'up' : 'down';
                        }
                    }
                }
                return { group: ind.group, stat: stat };
            }, function () {
                return { group: ind.group, stat: { label: ind.label, valueStr: 'Not Available', yearTag: '', changeStr: '', dir: '' } };
            }));
        });

        // Rainfall (annual total) for the selected country + year
        promises.push(loadRainfall(country));

        // GDP chart
        promises.push(loadGdpChart(country));

        $q.all(promises).then(function (results) {
            $scope.mainStats = [];
            $scope.budgetStats = [];
            results.forEach(function (r) {
                if (!r || !r.group) return;
                if (r.group === 'budget') $scope.budgetStats.push(r.stat);
                else $scope.mainStats.push(r.stat);
            });
            $scope.dataLoaded = true;
            $scope.lastUpdated = new Date().toLocaleString();
        });
    };

    function loadRainfall(country) {
        $scope.rainfall = 'Loading...';
        var today = new Date();
        var year = $scope.selectedYear;
        var start = year + '-01-01';
        var end = year >= today.getFullYear() ? today.toISOString().slice(0, 10) : year + '-12-31';
        var url = 'https://archive-api.open-meteo.com/v1/archive?latitude=' + country.lat +
            '&longitude=' + country.lon + '&start_date=' + start + '&end_date=' + end +
            '&daily=precipitation_sum&timezone=auto';
        return $http.get(url).then(function (res) {
            var daily = (res.data.daily && res.data.daily.precipitation_sum) || [];
            var total = daily.filter(function (v) { return v !== null && !isNaN(v); })
                .reduce(function (s, v) { return s + v; }, 0);
            $scope.rainfall = daily.length ? total.toFixed(1) + ' mm' : 'Not Available';
        }, function () {
            $scope.rainfall = 'Not Available';
        });
    }

    function loadGdpChart(country) {
        var url = 'https://api.worldbank.org/v2/country/' + country.code +
            '/indicator/NY.GDP.MKTP.CD?format=json&per_page=100';
        return $http.get(url).then(function (res) {
            var data = ((res.data && res.data[1]) || [])
                .filter(function (e) { return e.value !== null && parseInt(e.date, 10) <= $scope.selectedYear; })
                .slice(0, 6).reverse();
            var ctx = document.getElementById('gdpChart').getContext('2d');
            if ($scope.gdpChart) { $scope.gdpChart.destroy(); }
            $scope.gdpChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(function (e) { return e.date; }),
                    datasets: [{
                        label: 'GDP (USD) - ' + country.name,
                        data: data.map(function (e) { return e.value; }),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true } },
                    scales: { y: { beginAtZero: false } }
                }
            });
        });
    }

    $scope.getData();
});
