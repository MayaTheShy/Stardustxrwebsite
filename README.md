# Stardust XR Website

This repository contains a minimal static website for the Stardust XR project.

## Usage

No build tools are required. Open `index.html` in your browser or serve the
folder with any static web server.

### Image popup

Clicking most images on the site (feature or showcase images and images inside
the documentation content) will open a lightbox-style popup. To opt-out for a
particular image, add the `no-popup` class to the `<img>` element. You can also
set a `data-full` attribute on an `<img>` to point to a higher-resolution
source for the popup.

The popup will try to show the image at its native resolution when it fits
inside your browser window; otherwise it will scale down proportionally so it
still fits with a small margin. A window-like frame and a top-right X button
wrap the image so it looks and feels like a native window.

## Documentation

Markdown files live in the `docs/` directory. The docs page loads them on demand
using the [Marked](https://marked.js.org/) library. To link to a document, use a
URL of the form:

```
/docs/#path/to/file
```

Adding a new document is as easy as dropping a `.md` file into the `docs`
folder.
