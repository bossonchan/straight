exports.merge = function (a, b) {
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};

exports.uniq = function (arr) {
  var hash = {}, result = [];
  for (var i = 0; i < arr.length; i++) {
    if ( !hash.hasOwnProperty(arr[i]) ) {
      hash[arr[i]] = true;
      result.push(arr[i]);
    }
  }
  return result;
}
