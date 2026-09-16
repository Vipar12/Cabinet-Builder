# Cabinet Builder

This is a self-contained Three.js cabinet configurator intended for WordPress embedding. It lets visitors enter width, height, depth, door style, and an integer shelf count in inches, then generates the corresponding cabinet model with orbit controls.

## WordPress import

Upload `cabinet-builder.js` and `cabinet-builder.css` to the same public folder on your site. Add the stylesheet and mount point to a Custom HTML block:

```html
<link rel="stylesheet" href="https://your-site.example/wp-content/uploads/cabinet-builder.css">
<div id="cabinet-builder"></div>
<script src="https://your-site.example/wp-content/uploads/cabinet-builder.js"></script>
<script>
	CabinetBuilder.mount('#cabinet-builder', {
		doorStyles: ['Shaker', 'Slab', 'Raised panel', 'Flat recessed panel'],
		woodFinishes: ['White oak', 'Walnut', 'Painted white'],
		woodTextures: {
			'White oak': 'https://your-site.example/wp-content/uploads/white-oak.jpg',
			'Walnut': 'https://your-site.example/wp-content/uploads/walnut.jpg'
		}
	});
</script>
```

The widget loads Three.js and OrbitControls from the public unpkg CDN. The `index.html` file is a local preview. The door is displayed open 90 degrees, and the door-style, wood-finish, and wood-texture options can be customized through the mount options shown above. Texture URLs should point to public WordPress media URLs. If a finish has no texture URL, the solid cabinet color is used instead. The current `assets/references/` folder is not required by the widget.