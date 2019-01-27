"use strict";

class gsuiPopup {
	static alert( title, msg, ok ) {
		this._init();
		this._emptyCnt();
		this.clWindow.add( "gsuiPopup-noText", "gsuiPopup-noCancel" );
		this._setOkCancelBtns( ok, false );
		return this._open( "alert", title, msg );
	}
	static confirm( title, msg, ok, cancel ) {
		this._init();
		this._emptyCnt();
		this.clWindow.remove( "gsuiPopup-noCancel" );
		this.clWindow.add( "gsuiPopup-noText" );
		this._setOkCancelBtns( ok, cancel );
		return this._open( "confirm", title, msg );
	}
	static prompt( title, msg, val, ok, cancel ) {
		this._init();
		this._emptyCnt();
		this.clWindow.remove( "gsuiPopup-noText", "gsuiPopup-noCancel" );
		this._setOkCancelBtns( ok, cancel );
		return this._open( "prompt", title, msg, val );
	}
	static custom( obj ) {
		this._init();
		this._emptyCnt();
		this._fnSubmit = obj.submit || null;
		this.clWindow.remove( "gsuiPopup-noText" );
		this._setOkCancelBtns( obj.ok, obj.cancel || false );
		obj.element
			? this.elCnt.append( obj.element )
			: Element.prototype.append.apply( this.elCnt, obj.elements );
		return this._open( "custom", obj.title );
	}
	static close() {
		if ( this.isOpen ) {
			this.elCancel.click();
		}
	}

	// private:
	static _setOkCancelBtns( ok, cancel ) {
		this.clWindow.toggle( "gsuiPopup-noCancel", cancel === false );
		this.elCancel.value = cancel || "Cancel";
		this.elOk.value = ok || "Ok";
	}
	static _emptyCnt() {
		const elCnt = this.elCnt;

		while ( elCnt.firstChild ) {
			elCnt.firstChild.remove();
		}
	}
	static _init() {
		if ( !this._ready ) {
			const qs = s => document.querySelector( `#gsuiPopup${ s }` );

			this.elRoot = qs( "" );
			this.elOk = qs( "Ok" );
			this.elCnt = qs( "Content" );
			this.elMsg = qs( "Message" );
			this.elText = qs( "InputText" );
			this.elForm = qs( "Body" );
			this.elWindow = qs( "Window" );
			this.elHeader = qs( "Head" );
			this.elCancel = qs( "Cancel" );
			this.clWindow = this.elWindow.classList;

			this.elRoot.onclick =
			this.elCancel.onclick = this._cancelClick.bind( this );
			this.elForm.onsubmit = this._submit.bind( this );
			this.elWindow.onkeyup =
			this.elWindow.onclick = e => { e.stopPropagation(); };
			this.elWindow.onkeydown = e => {
				if ( e.keyCode === 27 ) {
					this._cancelClick();
				}
				e.stopPropagation();
			};
			this._ready = true;
		}
	}
	static _open( type, title, msg, value ) {
		this.type = type;
		this.isOpen = true;
		this.elHeader.textContent = title;
		this.elMsg.innerHTML = msg || "";
		this.elText.value = arguments.length > 3 ? value : "";
		this.elWindow.dataset.type = type;
		this.elRoot.classList.add( "gsuiPopup-show" );
		setTimeout( () => {
			if ( type === "prompt" ) {
				this.elText.select();
			} else {
				const inp = type !== "custom" ? null
					: this.elCnt.querySelector( "input" );

				( inp || this.elOk ).focus();
			}
		}, 250 );
		return new Promise( res => this.resolve = res )
			.then( val => {
				this.isOpen = false;
				this.elRoot.classList.remove( "gsuiPopup-show" );
				return val;
			} );
	}
	static _cancelClick() {
		this.resolve(
			this.type === "confirm" ? false :
			this.type === "prompt" ? null : undefined );
	}
	static _submit( e ) {
		switch ( this.type ) {
			case "confirm": this.resolve( true ); break;
			case "alert": this.resolve( undefined ); break;
			case "prompt": this.resolve( this.elText.value ); break;
			case "custom":
				const fn = this._fnSubmit,
					inps = Array.from( this.elForm ),
					obj = inps.reduce( ( obj, inp ) => {
						if ( inp.name ) {
							obj[ inp.name ] = inp.value;
						}
						return obj;
					}, {} );

				if ( !fn ) {
					this.resolve( obj );
				} else {
					const fnRes = fn( obj );

					if ( fnRes !== false ) {
						fnRes && fnRes.then
							? fnRes.then( res => {
								if ( res !== false ) {
									this.resolve( obj );
								}
							} )
							: this.resolve( obj );
					}
				}
		}
		return false;
	}
}
