/*	-----------------------------------------------------------------------------------------------
	Namespace
--------------------------------------------------------------------------------------------------- */

var twentytwenty = twentytwenty || {};

// Set a default value for scrolled.
twentytwenty.scrolled = 0;

// polyfill closest
// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
if ( ! Element.prototype.closest ) {
	Element.prototype.closest = function( s ) {
		var el = this;

		do {
			if ( el.matches( s ) ) {
				return el;
			}

			el = el.parentElement || el.parentNode;
		} while ( el !== null && el.nodeType === 1 );

		return null;
	};
}

// polyfill forEach
// https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach#Polyfill
if ( window.NodeList && ! NodeList.prototype.forEach ) {
	NodeList.prototype.forEach = function( callback, thisArg ) {
		var i;

		thisArg = thisArg || window;

		for ( i = 0; i < this.length; i++ ) {
			callback.call( thisArg, this[ i ], i, this );
		}
	};
}

// event "polyfill"
twentytwenty.createEvent = function( eventName ) {
	var event;
	if ( typeof window.Event === 'function' ) {
		event = new Event( eventName );
	} else {
		event = document.createEvent( 'Event' );
		event.initEvent( eventName, true, false );
	}
	return event;
};

// matches "polyfill"
// https://developer.mozilla.org/es/docs/Web/API/Element/matches
if ( ! Element.prototype.matches ) {
	Element.prototype.matches =
		Element.prototype.matchesSelector ||
		Element.prototype.mozMatchesSelector ||
		Element.prototype.msMatchesSelector ||
		Element.prototype.oMatchesSelector ||
		Element.prototype.webkitMatchesSelector ||
		function( s ) {
			var matches = ( this.document || this.ownerDocument ).querySelectorAll( s ),
				i = matches.length;
			while ( --i >= 0 && matches.item( i ) !== this ) {}
			return i > -1;
		};
}

/*	-----------------------------------------------------------------------------------------------
	Cover Modals
--------------------------------------------------------------------------------------------------- */

twentytwenty.coverModals = {

	init: function() {
		if ( document.querySelector( '.cover-modal' ) ) {
			// Handle cover modals when they're toggled
			this.onToggle();

			// When toggled, untoggle if visitor clicks on the wrapping element of the modal
			this.outsideUntoggle();

			// Close on escape key press
			this.closeOnEscape();

			// Hide and show modals before and after their animations have played out
			this.hideAndShowModals();
		}
	},

	// Handle cover modals when they're toggled
	onToggle: function() {
		document.querySelector( '.cover-modal' ).addEventListener( 'toggled', function( event ) {
			var modal, body;

			modal = event.target;
			body = document.body;

			if ( modal.classList.contains( 'active' ) ) {
				body.classList.add( 'showing-modal' );
			} else {
				body.classList.remove( 'showing-modal' );
				body.classList.add( 'hiding-modal' );

				// Remove the hiding class after a delay, when animations have been run
				setTimeout( function() {
					body.classList.remove( 'hiding-modal' );
				}, 500 );
			}
		} );
	},

	// Close modal on outside click
	outsideUntoggle: function() {
		document.addEventListener( 'click', function( event ) {
			var target = event.target;
			var modal = document.querySelector( '.cover-modal.active' );

			if ( target === modal ) {
				this.untoggleModal( target );
			}
		}.bind( this ) );
	},

	// Close modal on escape key press
	closeOnEscape: function() {
		document.addEventListener( 'keydown', function( event ) {
			if ( event.keyCode === 27 ) {
				event.preventDefault();
				document.querySelectorAll( '.cover-modal.active' ).forEach( function( element ) {
					this.untoggleModal( element );
				}.bind( this ) );
			}
		}.bind( this ) );
	},

	// Hide and show modals before and after their animations have played out
	hideAndShowModals: function() {
		var modals, htmlStyle, adminBar, _doc, _win;

		_doc = document;
		_win = window;
		modals = _doc.querySelectorAll( '.cover-modal' );
		htmlStyle = _doc.documentElement.style;
		adminBar = _doc.querySelector( '#wpadminbar' );

		function getAdminBarHeight( negativeValue ) {
			var currentScroll, height;

			currentScroll = _win.pageYOffset;

			if ( adminBar ) {
				height = currentScroll + adminBar.getBoundingClientRect().height;

				return negativeValue ? -height : height;
			}

			return currentScroll === 0 ? 0 : -currentScroll;
		}

		function htmlStyles() {
			var overflow = _win.innerHeight > _doc.documentElement.getBoundingClientRect().height;

			return {
				'overflow-y': overflow ? 'hidden' : 'scroll',
				position: 'fixed',
				width: '100%',
				top: getAdminBarHeight( true ) + 'px',
				left: 0
			};
		}

		// Show the modal
		modals.forEach( function( modal ) {
			modal.addEventListener( 'toggle-target-before-inactive', function( event ) {
				var styles, paddingTop, offsetY, mQuery;

				styles = htmlStyles();
				offsetY = _win.pageYOffset;
				paddingTop = ( Math.abs( getAdminBarHeight() ) - offsetY ) + 'px';
				mQuery = _win.matchMedia( '(max-width: 600px)' );

				if ( event.target !== modal ) {
					return;
				}

				Object.keys( styles ).forEach( function( styleKey ) {
					htmlStyle.setProperty( styleKey, styles[ styleKey ] );
				} );

				_win.twentytwenty.scrolled = parseInt( styles.top );

				if ( adminBar ) {
					_doc.body.style.setProperty( 'padding-top', paddingTop );

					if ( mQuery.matches ) {
						if ( offsetY >= getAdminBarHeight() ) {
							modal.style.setProperty( 'top', 0 );
						} else {
							modal.style.setProperty( 'top', ( getAdminBarHeight() - offsetY ) + 'px' );
						}
					}
				}

				modal.classList.add( 'show-modal' );
			} );

			// Hide the modal after a delay, so animations have time to play out
			modal.addEventListener( 'toggle-target-after-inactive', function( event ) {
				if ( event.target !== modal ) {
					return;
				}

				setTimeout( function() {
					var clickedEl;

					clickedEl = twentytwenty.toggles.clickedEl;

					modal.classList.remove( 'show-modal' );

					Object.keys( htmlStyles() ).forEach( function( styleKey ) {
						htmlStyle.removeProperty( styleKey );
					} );

					if ( adminBar ) {
						_doc.body.style.removeProperty( 'padding-top' );
						modal.style.removeProperty( 'top' );
					}

					_win.scrollTo( 0, Math.abs( _win.twentytwenty.scrolled + getAdminBarHeight() ) );

					_win.twentytwenty.scrolled = 0;

					if ( clickedEl !== false ) {
						clickedEl.focus();
						clickedEl = false;
					}
				}, 500 );
			} );
		} );
	},

	// Untoggle a modal
	untoggleModal: function( modal ) {
		var modalToggle, modalTargetClass;

		modalToggle = false;

		// If the modal has specified the string (ID or class) used by toggles to target it, untoggle the toggles with that target string
		// The modal-target-string must match the string toggles use to target the modal
		if ( modal.dataset.modalTargetString ) {
			modalTargetClass = modal.dataset.modalTargetString;

			modalToggle = document.querySelector( '*[data-toggle-target="' + modalTargetClass + '"]' );
		}

		// If a modal toggle exists, trigger it so all of the toggle options are included
		if ( modalToggle ) {
			modalToggle.click();

			// If one doesn't exist, just hide the modal
		} else {
			modal.classList.remove( 'active' );
		}
	}

}; // twentytwenty.coverModals

/*	-----------------------------------------------------------------------------------------------
	Intrinsic Ratio Embeds
--------------------------------------------------------------------------------------------------- */

twentytwenty.intrinsicRatioVideos = {

	init: function() {
		this.makeFit();

		window.addEventListener( 'resize', function() {
			this.makeFit();
		}.bind( this ) );
	},

	makeFit: function() {
		document.querySelectorAll( 'iframe, object, video' ).forEach( function( video ) {
			var container, ratio, iTargetWidth;

			container = video.parentNode;

			// Skip videos we want to ignore
			if ( video.classList.contains( 'intrinsic-ignore' ) || video.parentNode.classList.contains( 'intrinsic-ignore' ) ) {
				return true;
			}

			if ( ! video.dataset.origwidth ) {
				// Get the video element proportions
				video.setAttribute( 'data-origwidth', video.width );
				video.setAttribute( 'data-origheight', video.height );
			}

			iTargetWidth = container.offsetWidth;

			// Get ratio from proportions
			ratio = iTargetWidth / video.dataset.origwidth;

			// Scale based on ratio, thus retaining proportions
			video.style.width = iTargetWidth + 'px';
			video.style.height = ( video.dataset.origheight * ratio ) + 'px';
		} );
	}

}; // twentytwenty.instrinsicRatioVideos

/*	-----------------------------------------------------------------------------------------------
	Smooth Scroll
--------------------------------------------------------------------------------------------------- */

twentytwenty.smoothScroll = {

	init: function() {
		// Scroll to anchor
		this.scrollToAnchor();

		// Scroll to element
		this.scrollToElement();
	},

	// Scroll to anchor
	scrollToAnchor: function() {
		var anchorElements = document.querySelectorAll( 'a[href*="#"]' );
		var anchorElementsList = Array.prototype.slice.call( anchorElements );
		anchorElementsList.filter( function( element ) {
			if ( element.href === '#' || element.href === '#0' || element.classList.contains( '.do-not-scroll' ) || element.classList.contains( 'skip-link' ) ) {
				return false;
			}
			return true;
		} ).forEach( function( element ) {
			element.addEventListener( 'click', function( event ) {
				var target, scrollOffset, originalOffset, adminBar, scrollSpeed, additionalOffset;

				// On-page links
				if ( window.location.hostname === event.target.hostname ) {
					// Figure out element to scroll to
					target = window.location.hash !== '' && document.querySelector( window.location.hash );
					target = target ? target : event.target.hash !== '' && document.querySelector( event.target.hash );

					// Does a scroll target exist?
					if ( target ) {
						// Only prevent default if animation is actually gonna happen
						event.preventDefault();

						// Get options
						additionalOffset = event.target.dataset.additionalOffset;
						scrollSpeed = event.target.dataset.scrollSpeed ? event.target.dataset.scrollSpeed : 500;

						// Determine offset

						adminBar = document.querySelector( '#wpadminbar' );

						originalOffset = target.getBoundingClientRect().top + window.pageYOffset;
						scrollOffset = additionalOffset ? originalOffset + additionalOffset : originalOffset;

						if ( adminBar && event.target.className === 'to-the-top' ) {
							scrollOffset = scrollOffset - adminBar.getBoundingClientRect().height;
						}

						twentytwentyScrollTo( scrollOffset, null, scrollSpeed );

						window.location.hash = event.target.hash.slice( 1 );
					}
				}
			} );
		} );
	},

	// Scroll to element
	scrollToElement: function() {
		var scrollToElement = document.querySelector( '*[data-scroll-to]' );

		if ( scrollToElement ) {
			scrollToElement.addEventListener( 'click', function( event ) {
				var target, originalOffset, additionalOffset, scrollOffset, scrollSpeed;

				// Figure out element to scroll to
				target = event.target.dataset.twentytwentyScrollTo;

				// Make sure said element exists
				if ( target ) {
					event.preventDefault();

					// Get options
					additionalOffset = event.target.dataset.additionalOffset;
					scrollSpeed = event.target.dataset.scrollSpeed ? event.target.dataset.scrollSpeed : 500;

					// Determine offset
					originalOffset = target.getBoundingClientRect().top + window.pageYOffset;
					scrollOffset = additionalOffset ? originalOffset + additionalOffset : originalOffset;

					twentytwentyScrollTo( scrollOffset, null, scrollSpeed );
				}
			} );
		}
	}

}; // twentytwenty.smoothScroll

/*	-----------------------------------------------------------------------------------------------
	Modal Menu
--------------------------------------------------------------------------------------------------- */
twentytwenty.modalMenu = {

	init: function() {
		// If the current menu item is in a sub level, expand all the levels higher up on load
		this.expandLevel();
		this.goBackToCloseButton();
	},

	expandLevel: function() {
		var modalMenus = document.querySelectorAll( '.modal-menu' );

		modalMenus.forEach( function( modalMenu ) {
			var activeMenuItem = modalMenu.querySelector( '.current-menu-item' );

			if ( activeMenuItem ) {
				twentytwentyFindParents( activeMenuItem, 'li' ).forEach( function( element ) {
					var subMenuToggle = element.querySelector( '.sub-menu-toggle' );
					if ( subMenuToggle ) {
						twentytwenty.toggles.performToggle( subMenuToggle, true );
					}
				} );
			}
		} );
	},

	// If the current menu item is the last one, return to close button when tab
	goBackToCloseButton: function() {
		document.addEventListener( 'keydown', function( event ) {
			var closeMenuButton = document.querySelector( '.toggle.close-nav-toggle' );
			var mobileMenu = document.querySelector( '.mobile-menu' );
			var isDesktop = window.getComputedStyle( mobileMenu, null ).getPropertyValue( 'display' ) === 'none';

			var menuLinks = isDesktop ?
				document.querySelectorAll( '.menu-modal .expanded-menu .modal-menu li' ) :
				document.querySelectorAll( '.menu-modal .mobile-menu .modal-menu li' );

			var firstLevelmenuLinks = isDesktop ?
				document.querySelectorAll( '.menu-modal .expanded-menu .modal-menu > li' ) :
				document.querySelectorAll( '.menu-modal .mobile-menu .modal-menu > li' );

			var lastMenuLinkToggleButton = firstLevelmenuLinks[firstLevelmenuLinks.length - 1].querySelector( '.sub-menu-toggle' ) || undefined;
			var lastMenuLinkHasSubClosedMenu = lastMenuLinkToggleButton && ! lastMenuLinkToggleButton.classList.contains( 'active' );

			var lastToogleSubMenuLinkNotOpened = isDesktop ?
				document.querySelector( '.menu-modal .expanded-menu .modal-menu .sub-menu .sub-menu-toggle:not(.active)' ) :
				document.querySelector( '.menu-modal .mobile-menu .sub-menu .sub-menu-toggle:not(.active)' );

			var socialLinks = document.querySelectorAll( '.menu-modal .social-menu li' );
			var hasSocialMenu = document.querySelectorAll( '.menu-modal .social-menu' ).length > 0;
			var lastModalMenuItems = hasSocialMenu ? socialLinks : menuLinks;
			var focusedElementParentLi = twentytwentyFindParents( event.target, 'li' );
			var focusedElementIsInsideModal = twentytwentyFindParents( event.target, '.menu-modal' ).length > 0;

			var lastMenuItem = lastModalMenuItems[lastModalMenuItems.length - 1];

			var isFirstModalItem = event.target === closeMenuButton;

			var isLastModalItem = focusedElementIsInsideModal && focusedElementParentLi[0] ?
				focusedElementParentLi[0].className === lastMenuItem.className :
				undefined;

			if ( lastMenuLinkToggleButton && lastMenuLinkHasSubClosedMenu && ! hasSocialMenu ) { // Last 1st level item has submenu and is closed
				isLastModalItem = event.target === lastMenuLinkToggleButton;
				lastMenuItem = lastMenuLinkToggleButton;
			}
			if ( lastMenuLinkToggleButton && ! lastMenuLinkHasSubClosedMenu && ! hasSocialMenu ) { // Last 1st level item has submenu is opened
				isLastModalItem = event.target === lastToogleSubMenuLinkNotOpened || event.target === menuLinks[menuLinks.length - 1].querySelector( 'a' );
				lastMenuItem = lastToogleSubMenuLinkNotOpened || menuLinks[menuLinks.length - 1].querySelector( 'a' );
			}

			if ( ! event.shiftKey && event.key === 'Tab' && isLastModalItem ) {
				// Forward
				event.preventDefault();
				closeMenuButton.focus();
			}
			if ( event.shiftKey && event.key === 'Tab' && isFirstModalItem ) {
				// Backward
				event.preventDefault();
				if ( lastMenuItem.querySelector( 'a' ) ) {
					lastMenuItem.querySelector( 'a' ).focus();
				} else {
					lastMenuItem.focus();
				}
			}
		} );
	}
}; // twentytwenty.modalMenu

/*	-----------------------------------------------------------------------------------------------
	Primary Menu
--------------------------------------------------------------------------------------------------- */

twentytwenty.primaryMenu = {

	init: function() {
		this.focusMenuWithChildren();
	},

	// The focusMenuWithChildren() function implements Keyboard Navigation in the Primary Menu
	// by adding the '.focus' class to all 'li.menu-item-has-children' when the focus is on the 'a' element.
	focusMenuWithChildren: function() {
		// Get all the link elements within the primary menu.
		var menu = document.querySelector( '.primary-menu-wrapper' );
		var links = menu.getElementsByTagName( 'a' );
		var i, len;

		// Each time a menu link is focused or blurred, toggle focus.
		for ( i = 0, len = links.length; i < len; i++ ) {
			links[i].addEventListener( 'focus', toggleFocus, true );
			links[i].addEventListener( 'blur', toggleFocus, true );
		}

		//Sets or removes the .focus class on an element.
		function toggleFocus() {
			var self = this;

			// Move up through the ancestors of the current link until we hit .primary-menu.
			while ( -1 === self.className.indexOf( 'primary-menu' ) ) {
				// On li elements toggle the class .focus.
				if ( 'li' === self.tagName.toLowerCase() ) {
					if ( -1 !== self.className.indexOf( 'focus' ) ) {
						self.className = self.className.replace( ' focus', '' );
					} else {
						self.className += ' focus';
					}
				}
				self = self.parentElement;
			}
		}
	}
}; // twentytwenty.primaryMenu

/*	-----------------------------------------------------------------------------------------------
	Toggles
--------------------------------------------------------------------------------------------------- */

twentytwenty.toggles = {

	clickedEl: false,

	init: function() {
		// Do the toggle
		this.toggle();

		// Check for toggle/untoggle on resize
		this.resizeCheck();

		// Check for untoggle on escape key press
		this.untoggleOnEscapeKeyPress();
	},

	performToggle: function( element, instantly ) {
		var self, toggle, _doc, targetString, target, timeOutTime, classToToggle, activeClass;

		self = this;
		_doc = document;

		// Get our targets
		toggle = element;
		targetString = toggle.dataset.toggleTarget;
		activeClass = 'active';

		// Elements to focus after modals are closed
		if ( ! _doc.querySelectorAll( '.show-modal' ).length ) {
			self.clickedEl = _doc.activeElement;
		}

		if ( targetString === 'next' ) {
			target = toggle.nextSibling;
		} else {
			target = _doc.querySelector( targetString );
		}

		// Trigger events on the toggle targets before they are toggled
		if ( target.classList.contains( activeClass ) ) {
			target.dispatchEvent( twentytwenty.createEvent( 'toggle-target-before-active' ) );
		} else {
			target.dispatchEvent( twentytwenty.createEvent( 'toggle-target-before-inactive' ) );
		}

		// Get the class to toggle, if specified
		classToToggle = toggle.dataset.classToToggle ? toggle.dataset.classToToggle : activeClass;

		// For cover modals, set a short timeout duration so the class animations have time to play out
		timeOutTime = 0;

		if ( target.classList.contains( 'cover-modal' ) ) {
			timeOutTime = 10;
		}

		setTimeout( function() {
			var focusElement, duration, newTarget, subMenued;

			subMenued = target.classList.contains( 'sub-menu' );
			newTarget = subMenued ? toggle.closest( '.menu-item' ).querySelector( '.sub-menu' ) : target;
			duration = toggle.dataset.toggleDuration;

			// Toggle the target of the clicked toggle
			if ( toggle.dataset.toggleType === 'slidetoggle' && ! instantly && duration !== '0' ) {
				twentytwentyMenuToggle( newTarget, duration );
			} else {
				newTarget.classList.toggle( classToToggle );
			}

			// If the toggle target is 'next', only give the clicked toggle the active class
			if ( targetString === 'next' ) {
				toggle.classList.toggle( activeClass );
			} else if ( target.classList.contains( 'sub-menu' ) ) {
				toggle.classList.toggle( activeClass );
			} else {
				// If not, toggle all toggles with this toggle target
				_doc.querySelector( '*[data-toggle-target="' + targetString + '"]' ).classList.toggle( activeClass );
			}

			// Toggle aria-expanded on the target
			twentytwentyToggleAttribute( target, 'aria-expanded', 'true', 'false' );

			// Toggle aria-expanded on the toggle
			twentytwentyToggleAttribute( toggle, 'aria-expanded', 'true', 'false' );

			// Toggle body class
			if ( toggle.dataset.toggleBodyClass ) {
				_doc.querySelector( 'body' ).classList.toggle( toggle.dataset.toggleBodyClass );
			}

			// Check whether to set focus
			if ( toggle.dataset.setFocus ) {
				focusElement = _doc.querySelector( toggle.dataset.setFocus );

				if ( focusElement ) {
					if ( target.classList.contains( activeClass ) ) {
						focusElement.focus();
					} else {
						focusElement.blur();
					}
				}
			}

			// Trigger the toggled event on the toggle target
			target.dispatchEvent( twentytwenty.createEvent( 'toggled' ) );

			// Trigger events on the toggle targets after they are toggled
			if ( target.classList.contains( activeClass ) ) {
				target.dispatchEvent( twentytwenty.createEvent( 'toggle-target-after-active' ) );
			} else {
				target.dispatchEvent( twentytwenty.createEvent( 'toggle-target-after-inactive' ) );
			}
		}, timeOutTime );
	},

	// Do the toggle
	toggle: function() {
		var self = this;

		document.querySelectorAll( '*[data-toggle-target]' ).forEach( function( element ) {
			element.addEventListener( 'click', function( event ) {
				event.preventDefault();
				self.performToggle( element );
			} );
		} );
	},

	// Check for toggle/untoggle on screen resize
	resizeCheck: function() {
		if ( document.querySelectorAll( '*[data-untoggle-above], *[data-untoggle-below], *[data-toggle-above], *[data-toggle-below]' ).length ) {
			window.addEventListener( 'resize', function() {
				var winWidth = window.innerWidth,
					toggles = document.querySelectorAll( '.toggle' );

				toggles.forEach( function( toggle ) {
					var unToggleAbove = toggle.dataset.untoggleAbove,
						unToggleBelow = toggle.dataset.untoggleBelow,
						toggleAbove = toggle.dataset.toggleAbove,
						toggleBelow = toggle.dataset.toggleBelow;

					// If no width comparison is set, continue
					if ( ! unToggleAbove && ! unToggleBelow && ! toggleAbove && ! toggleBelow ) {
						return;
					}

					// If the toggle width comparison is true, toggle the toggle
					if (
						( ( ( unToggleAbove && winWidth > unToggleAbove ) ||
							( unToggleBelow && winWidth < unToggleBelow ) ) &&
							toggle.classList.contains( 'active' ) ) ||
						( ( ( toggleAbove && winWidth > toggleAbove ) ||
							( toggleBelow && winWidth < toggleBelow ) ) &&
							! toggle.classList.contains( 'active' ) )
					) {
						toggle.click();
					}
				} );
			} );
		}
	},

	// Close toggle on escape key press
	untoggleOnEscapeKeyPress: function() {
		document.addEventListener( 'keyup', function( event ) {
			if ( event.key === 'Escape' ) {
				document.querySelectorAll( '*[data-untoggle-on-escape].active' ).forEach( function( element ) {
					if ( element.classList.contains( 'active' ) ) {
						element.click();
					}
				} );
			}
		} );
	}

}; // twentytwenty.toggles

/**
 * Is the DOM ready
 *
 * this implementation is coming from https://gomakethings.com/a-native-javascript-equivalent-of-jquerys-ready-method/
 *
 * @param {Function} fn Callback function to run.
 */
function twentytwentyDomReady( fn ) {
	if ( typeof fn !== 'function' ) {
		return;
	}

	if ( document.readyState === 'interactive' || document.readyState === 'complete' ) {
		return fn();
	}

	document.addEventListener( 'DOMContentLoaded', fn, false );
}

twentytwentyDomReady( function() {
	twentytwenty.toggles.init();	// Handle toggles
	twentytwenty.coverModals.init();	// Handle cover modals
	twentytwenty.intrinsicRatioVideos.init();	// Retain aspect ratio of videos on window resize
	twentytwenty.smoothScroll.init();	// Smooth scroll to anchor link or a specific element
	twentytwenty.modalMenu.init();	// Modal Menu
	twentytwenty.primaryMenu.init();	// Primary Menu
} );

/*	-----------------------------------------------------------------------------------------------
	Helper functions
--------------------------------------------------------------------------------------------------- */

/* Toggle an attribute ----------------------- */

function twentytwentyToggleAttribute( element, attribute, trueVal, falseVal ) {
	if ( trueVal === undefined ) {
		trueVal = true;
	}
	if ( falseVal === undefined ) {
		falseVal = false;
	}
	if ( element[ attribute ] !== trueVal ) {
		element.setAttribute( attribute, trueVal );
	} else {
		element.setAttribute( attribute, falseVal );
	}
}

/**
 * Toggle a menu item on or off.
 *
 * @param {HTMLElement} target
 * @param {number} duration
 */
function twentytwentyMenuToggle( target, duration ) {
	var initialPositions = [];
	var finalPositions = [];
	var initialParentHeight, finalParentHeight;
	var menu, menuItems;
	var transitionListener;

	if ( ! target ) {
		return;
	}

	menu = target.closest( '.menu-wrapper' );

	// Step 1: look at the initial positions of every menu item.
	menuItems = menu.querySelectorAll( '.menu-item' );

	menuItems.forEach( function( menuItem, index ) {
		initialPositions[ index ] = { x: menuItem.offsetLeft, y: menuItem.offsetTop };
	} );
	initialParentHeight = target.parentElement.offsetHeight;

	target.classList.add( 'toggling-target' );

	// Step 2: toggle target menu item and look at the final positions of every menu item.
	target.classList.toggle( 'active' );

	menuItems.forEach( function( menuItem, index ) {
		finalPositions[ index ] = { x: menuItem.offsetLeft, y: menuItem.offsetTop };
	} );
	finalParentHeight = target.parentElement.offsetHeight;

	// Step 3: close target menu item again.
	// The whole process happens without giving the browser a chance to render, so it's invisible.
	target.classList.toggle( 'active' );

	// Step 4: prepare animation.
	// Position all the items with absolute offsets, at the same starting position.
	// Shouldn't result in any visual changes if done right.
	menu.classList.add( 'is-toggling' );
	target.classList.toggle( 'active' );
	menuItems.forEach( function( menuItem, index ) {
		var initialPosition = initialPositions[ index ];
		if ( initialPosition.y === 0 && menuItem.parentElement === target ) {
			initialPosition.y = initialParentHeight;
		}
		menuItem.style.transform = 'translate(' + initialPosition.x + 'px, ' + initialPosition.y + 'px)';
	} );

	// The double rAF is unfortunately needed, since we're toggling CSS classes, and
	// the only way to ensure layout completion here across browsers is to wait twice.
	// This just delays the start of the animation by 2 frames and is thus not an issue.
	requestAnimationFrame( function() {
		requestAnimationFrame( function() {
			// Step 5: start animation by moving everything to final position.
			// All the layout work has already happened, while we were preparing for the animation.
			// The animation now runs entirely in CSS, using cheap CSS properties (opacity and transform)
			// that don't trigger the layout or paint stages.
			menu.classList.add( 'is-animating' );
			menuItems.forEach( function( menuItem, index ) {
				var finalPosition = finalPositions[ index ];
				if ( finalPosition.y === 0 && menuItem.parentElement === target ) {
					finalPosition.y = finalParentHeight;
				}
				if ( duration !== undefined ) {
					menuItem.style.transitionDuration = duration + 'ms';
				}
				menuItem.style.transform = 'translate(' + finalPosition.x + 'px, ' + finalPosition.y + 'px)';
			} );
			if ( duration !== undefined ) {
				target.style.transitionDuration = duration + 'ms';
			}
		} );

		// Step 6: finish toggling.
		// Remove all transient classes when the animation ends.
		transitionListener = function() {
			menu.classList.remove( 'is-animating' );
			menu.classList.remove( 'is-toggling' );
			target.classList.remove( 'toggling-target' );
			menuItems.forEach( function( menuItem ) {
				menuItem.style.transform = '';
				menuItem.style.transitionDuration = '';
			} );
			target.style.transitionDuration = '';
			target.removeEventListener( 'transitionend', transitionListener );
		};

		target.addEventListener( 'transitionend', transitionListener );
	} );
}

/**
 * traverses the DOM up to find elements matching the query
 *
 * @param {HTMLElement} target
 * @param {string} query
 * @return {NodeList} parents matching query
 */
function twentytwentyFindParents( target, query ) {
	var parents = [];

	// recursively go up the DOM adding matches to the parents array
	function traverse( item ) {
		var parent = item.parentNode;
		if ( parent instanceof HTMLElement ) {
			if ( parent.matches( query ) ) {
				parents.push( parent );
			}
			traverse( parent );
		}
	}

	traverse( target );

	return parents;
}

// twentytwentyEaseInOutQuad functions http://goo.gl/5HLl8
function twentytwentyEaseInOutQuad( t, b, c, d ) {
	t /= d / 2;
	if ( t < 1 ) {
		return ( ( ( c / 2 ) * t ) * t ) + b;
	}
	t--;
	return ( ( -c / 2 ) * ( ( t * ( t - 2 ) ) - 1 ) ) + b;
}

function twentytwentyScrollTo( to, callback, duration ) {
	var start, change, increment, currentTime;

	function move( amount ) {
		document.documentElement.scrollTop = amount;
		document.body.parentNode.scrollTop = amount;
		document.body.scrollTop = amount;
	}

	start = document.documentElement.scrollTop || document.body.parentNode.scrollTop || document.body.scrollTop;
	change = to - start;
	increment = 20;
	currentTime = 0;

	duration = ( typeof ( duration ) === 'undefined' ) ? 500 : duration;

	function animateScroll() {
		var val;

		// increment the time
		currentTime += increment;
		// find the value with the quadratic in-out twentytwentyEaseInOutQuad function
		val = twentytwentyEaseInOutQuad( currentTime, start, change, duration );
		// move the document.body
		move( val );
		// do the animation unless its over
		if ( currentTime < duration ) {
			window.requestAnimationFrame( animateScroll );
		} else if ( callback && typeof ( callback ) === 'function' ) {
			// the animation is done so lets callback
			callback();
		}
	}
	animateScroll();
}
