module.exports = toOutput

function toOutput (pieces) {
  var result = pieces[0]
  var substitutions = [].slice.call(arguments, 1)
  for (var i = 0; i < substitutions.length; ++i) {
    result += substitutions[i] + pieces[i + 1]
  }

  // Remove any indents and -> []
  result = result.split('\n').map(function (line) {
    return line.trim()
  })

  // Remove spacer lines if empty (allow newline spacers)
  if (result[0] === '') result.shift()
  if (result[result.length - 1] === '') result.pop()

  return result.join('\n')
}
