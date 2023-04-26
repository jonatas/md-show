# Minimal query

Will return a table when it does not know the type.

Click in the query to run it.

```sql
SELECT 1;
```
# Naming columns

If you name a `x` and `y` columns it will start bringing more data.

```sql
SELECT 1 as y, now() as x;
```

# Multi axis

For now, it's focused in time series data, which will have a single x and
multiple y series. To use several series, just prefix your column with `y`.

```sql
WITH candlesticks AS (
    SELECT
        time_bucket('1 day', time),
        symbol,
        candlestick_agg(time, price, day_volume) AS agg
    FROM
        crypto_ticks
    WHERE
        symbol = 'BTC/USD'
        AND time between now() - interval '1 year' AND now()
    GROUP BY 1,2
),
sma AS (
    SELECT
        time_bucket,
        symbol,
        avg((agg).close) OVER (PARTITION BY symbol ORDER BY time_bucket ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS sma
    FROM
        candlesticks
),
std_dev AS (
    SELECT
        sma.time_bucket,
        sma.symbol,
        sqrt(avg(((agg).close - sma) * ((agg).close - sma)) OVER (PARTITION BY sma.symbol ORDER BY sma.time_bucket ROWS BETWEEN 19 PRECEDING AND CURRENT ROW)) AS stddev
    FROM
        candlesticks,
        sma
    WHERE
        candlesticks.time_bucket = sma.time_bucket
        AND candlesticks.symbol = sma.symbol
)
SELECT
    std_dev.time_bucket as x,
    sma as y,
    sma + 2 * stddev AS y_upper_band,
    sma - 2 * stddev AS y_lower_band
FROM
    sma,
    std_dev
WHERE
    sma.time_bucket = std_dev.time_bucket
    AND sma.symbol = std_dev.symbol
ORDER BY 1 ASC;
```

# JSON

It can also accept plain data through the `data` alias and just send render it
using plot.ly.

```sql
WITH pair as (
  SELECT timevector(bucket, close)
  FROM one_day_candle where symbol = 'ADA/USD'
)
SELECT
  toolkit_experimental.to_text(
    timevector->toolkit_experimental.sort(),
    '{"x": {{ TIMES | json_encode() | safe  }},
      "y": {{ VALUES | json_encode() | safe }},
      "type": "scatter",
      "title": "ADA/USD Daily Close"
     }')::json as data from pair;
```

