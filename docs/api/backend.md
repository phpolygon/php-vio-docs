# Backend

Functions for querying the active rendering backend.

## vio_backend_name

```php
string vio_backend_name(VioContext $context)
```

Returns the name of the active backend (e.g., `"opengl"`, `"vulkan"`, `"metal"`, `"null"`).

## vio_backend_count

```php
int vio_backend_count()
```

Returns the number of registered backends.

## vio_backends

```php
string[] vio_backends()
```

Returns an array of all registered backend names.

```php
$backends = vio_backends();
// ["opengl", "vulkan", "metal", "null"]
```
