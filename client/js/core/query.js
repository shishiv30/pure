const hasInput = function ($input) {
	let defaultValue = $input.defaultValue;
	if ($input.value && $input.value != defaultValue) {
		return true;
	}
	return false;
}
export { hasInput };
