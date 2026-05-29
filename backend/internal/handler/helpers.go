package handler

import "strconv"

// parsePageSize parses page and size query params with silent-default behavior.
// strconv.Atoi failures default to 0, which is then clamped to the safe floor.
// No logging for invalid params (DRY extraction only, no behavior change).
func parsePageSize(pageStr, sizeStr string, defaultSize, maxSize int) (page, size int) {
	page, _ = strconv.Atoi(pageStr)
	size, _ = strconv.Atoi(sizeStr)
	if page < 1 {
		page = 1
	}
	if size < 1 || size > maxSize {
		size = defaultSize
	}
	return
}
