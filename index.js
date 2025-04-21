function test(arr) {
  const n = arr.length;
  const dp = new Array(n + 1).fill(1);
  let max = 1;
  for (let i = 1; i <= n; i++) {
    for (let j = i + 1; j <= n; j++) {
      if (arr[j - 1] > arr[i - 1]) {
        max = Math.max(dp[j], dp[i] + 1);
        dp[j] = max;
      }
    }
  }
  return max;
}
console.log(test([8, 9, 2, 6, 3, 7, 101, 18]));
