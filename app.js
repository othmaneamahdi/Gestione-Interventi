/**
 * Sistema di Gestione Interventi - Versione Migliorata
 * Gestisce interventi di manutenzione con interfaccia avanzata
 */

class GestioneInterventi {
    constructor() {
        // Dati principali
        this.interventi = [];
        this.tecnici = ['Mario Rossi', 'Luca Bianchi', 'Anna Verdi'];
        this.eliminatoTemp = null;
        this.storicoModifiche = [];
        
        // Stato interfaccia
        this.paginaCorrente = 1;
        this.elementiPerPagina = 25;
        this.ordinamento = { campo: 'dataOra', direzione: 'desc' };
        this.filtroCorrente = {};
        
        // Riferimenti DOM
        this.elements = {};
        
        // Inizializzazione
        this.init();
    }

    /**
     * Inizializzazione dell'applicazione
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.caricaDatiStorage();
        this.caricaTecnici();
        this.impostaDataCorrente();
        this.aggiornaInterfaccia();
        this.mostraNotifica('Sistema caricato correttamente', 'success');
    }

    /**
     * Cache degli elementi DOM per migliorare le performance
     */
    cacheElements() {
        const ids = [
            'interventoForm', 'formModifica', 'editIndex', 'editIndexModal',
            'asset', 'serial', 'descrizione', 'intervento', 'tecnico', 'dataOra', 'stato',
            'assetModal', 'serialModal', 'descrizioneModal', 'interventoModal', 
            'tecnicoModal', 'dataOraModal', 'statoModal',
            'nuovoTecnico', 'nuovoTecnicoModal', 'nuovoTecnicoGestione',
            'filtroInizio', 'filtroFine', 'filtroTecnico', 'search',
            'tabellaInterventi', 'contatoreTotale', 'contatoreVisibili',
            'elementiPerPagina', 'pagination',
            'alertContainer', 'loadingSpinner', 'formTitle',
            'statTotali', 'statInProgress', 'statClosed', 'statTecnici',
            'listaTecnici', 'toastContainer'
        ];

        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }

    /**
     * Setup degli event listeners
     */
    setupEventListeners() {
        // Form principale
        this.elements.interventoForm.addEventListener('submit', (e) => this.salvaIntervento(e));
        
        // Form modifica
        this.elements.formModifica.addEventListener('submit', (e) => this.salvaModifica(e));
        
        // Filtri con debounce
        const filtriInputs = ['filtroInizio', 'filtroFine', 'filtroTecnico', 'search'];
        filtriInputs.forEach(id => {
            this.elements[id].addEventListener('input', this.debounce(() => this.applicaFiltri(), 300));
        });

        // Validazione in tempo reale
        this.aggiungiValidazioneRealTime();

        // Gestione modal
        document.getElementById('modalModifica').addEventListener('hidden.bs.modal', () => {
            this.resetValidation(this.elements.formModifica);
        });

        // Conferma eliminazione
        document.getElementById('confermaEliminaBtn').addEventListener('click', () => {
            this.eliminaIntervento(this.indiceEliminazione);
            bootstrap.Modal.getInstance(document.getElementById('modalConfermaElimina')).hide();
        });

        // Pressione Enter per aggiungere tecnico
        this.elements.nuovoTecnico.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.aggiungiTecnico();
            }
        });

        this.elements.nuovoTecnicoModal.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.aggiungiTecnicoModal();
            }
        });

        this.elements.nuovoTecnicoGestione.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.aggiungiTecnicoGestione();
            }
        });
    }

    /**
     * Aggiunge validazione in tempo reale ai form
     */
    aggiungiValidazioneRealTime() {
        const forms = [this.elements.interventoForm, this.elements.formModifica];
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validaCampo(input));
                input.addEventListener('input', () => {
                    if (input.classList.contains('is-invalid')) {
                        this.validaCampo(input);
                    }
                });
            });
        });
    }

    /**
     * Valida un singolo campo
     */
    validaCampo(campo) {
        const isValid = campo.checkValidity();
        campo.classList.toggle('is-valid', isValid && campo.value.trim() !== '');
        campo.classList.toggle('is-invalid', !isValid);
        return isValid;
    }

    /**
     * Reset della validazione di un form
     */
    resetValidation(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });
        form.classList.remove('was-validated');
    }

    /**
     * Debounce function per ottimizzare le performance
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Carica i dati dal localStorage
     */
    caricaDatiStorage() {
        try {
            const interventiData = localStorage.getItem('interventi_v2');
            const tecniciData = localStorage.getItem('tecnici_v2');
            const storicoData = localStorage.getItem('storico_v2');

            if (interventiData) {
                this.interventi = JSON.parse(interventiData);
            }
            if (tecniciData) {
                this.tecnici = JSON.parse(tecniciData);
            }
            if (storicoData) {
                this.storicoModifiche = JSON.parse(storicoData);
            }
        } catch (error) {
            console.error('Errore nel caricamento dei dati:', error);
            this.mostraNotifica('Errore nel caricamento dei dati salvati', 'danger');
        }
    }

    /**
     * Salva i dati nel localStorage
     */
    salvaDatiStorage() {
        try {
            localStorage.setItem('interventi_v2', JSON.stringify(this.interventi));
            localStorage.setItem('tecnici_v2', JSON.stringify(this.tecnici));
            localStorage.setItem('storico_v2', JSON.stringify(this.storicoModifiche));
        } catch (error) {
            console.error('Errore nel salvataggio dei dati:', error);
            this.mostraNotifica('Errore nel salvataggio dei dati', 'danger');
        }
    }

    /**
     * Carica i tecnici nei select
     */
    caricaTecnici() {
        const selects = [this.elements.tecnico, this.elements.tecnicoModal];
        
        selects.forEach(select => {
            const valorePrecedente = select.value;
            select.innerHTML = '<option value="">-- Seleziona Tecnico --</option>';
            
            this.tecnici.forEach(tecnico => {
                const option = document.createElement('option');
                option.value = tecnico;
                option.textContent = tecnico;
                select.appendChild(option);
            });
            
            // Ripristina valore precedente se esistente
            if (valorePrecedente && this.tecnici.includes(valorePrecedente)) {
                select.value = valorePrecedente;
            }
        });

        this.aggiornaTecniciGestione();
    }

    /**
     * Aggiorna la visualizzazione dei tecnici nella sezione gestione
     */
    aggiornaTecniciGestione() {
        const container = this.elements.listaTecnici;
        container.innerHTML = '';

        this.tecnici.forEach(tecnico => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-secondary d-inline-flex align-items-center me-2 mb-2';
            badge.innerHTML = `
                ${tecnico}
                <button type="button" class="btn-close btn-close-white ms-2" 
                        onclick="app.rimuoviTecnicoGestione('${tecnico}')" 
                        aria-label="Rimuovi ${tecnico}"></button>
            `;
            container.appendChild(badge);
        });
    }

    /**
     * Imposta la data corrente nel campo datetime
     */
    impostaDataCorrente() {
        const ora = new Date();
        ora.setMinutes(ora.getMinutes() - ora.getTimezoneOffset());
        this.elements.dataOra.value = ora.toISOString().slice(0, 16);
    }

    /**
     * Aggiunge un nuovo tecnico
     */
    aggiungiTecnico() {
        const nome = this.elements.nuovoTecnico.value.trim();
        if (this.validaNuovoTecnico(nome)) {
            this.tecnici.push(nome);
            this.caricaTecnici();
            this.elements.nuovoTecnico.value = '';
            this.salvaDatiStorage();
            this.mostraNotifica(`Tecnico "${nome}" aggiunto`, 'success');
        }
    }

    /**
     * Aggiunge tecnico dalla modal
     */
    aggiungiTecnicoModal() {
        const nome = this.elements.nuovoTecnicoModal.value.trim();
        if (this.validaNuovoTecnico(nome)) {
            this.tecnici.push(nome);
            this.caricaTecnici();
            this.elements.nuovoTecnicoModal.value = '';
            this.salvaDatiStorage();
            this.mostraNotifica(`Tecnico "${nome}" aggiunto`, 'success');
        }
    }

    /**
     * Aggiunge tecnico dalla gestione
     */
    aggiungiTecnicoGestione() {
        const nome = this.elements.nuovoTecnicoGestione.value.trim();
        if (this.validaNuovoTecnico(nome)) {
            this.tecnici.push(nome);
            this.caricaTecnici();
            this.elements.nuovoTecnicoGestione.value = '';
            this.salvaDatiStorage();
            this.mostraNotifica(`Tecnico "${nome}" aggiunto`, 'success');
        }
    }

    /**
     * Valida il nome di un nuovo tecnico
     */
    validaNuovoTecnico(nome) {
        if (!nome) {
            this.mostraNotifica('Inserire il nome del tecnico', 'warning');
            return false;
        }
        if (this.tecnici.includes(nome)) {
            this.mostraNotifica('Tecnico già esistente', 'warning');
            return false;
        }
        if (nome.length < 2) {
            this.mostraNotifica('Il nome deve contenere almeno 2 caratteri', 'warning');
            return false;
        }
        return true;
    }

    /**
     * Rimuove un tecnico
     */
    rimuoviTecnico() {
        const tecnicoSelezionato = this.elements.tecnico.value;
        if (!tecnicoSelezionato) {
            this.mostraNotifica('Seleziona un tecnico da rimuovere', 'warning');
            return;
        }
        this.rimuoviTecnicoGestione(tecnicoSelezionato);
    }

    /**
     * Rimuove tecnico dalla modal
     */
    rimuoviTecnicoModal() {
        const tecnicoSelezionato = this.elements.tecnicoModal.value;
        if (!tecnicoSelezionato) {
            this.mostraNotifica('Seleziona un tecnico da rimuovere', 'warning');
            return;
        }
        this.rimuoviTecnicoGestione(tecnicoSelezionato);
    }

    /**
     * Rimuove un tecnico dalla gestione
     */
    rimuoviTecnicoGestione(nome) {
        if (this.tecnici.length <= 1) {
            this.mostraNotifica('Deve rimanere almeno un tecnico', 'warning');
            return;
        }

        this.tecnici = this.tecnici.filter(t => t !== nome);
        this.caricaTecnici();
        this.salvaDatiStorage();
        this.mostraNotifica(`Tecnico "${nome}" rimosso`, 'info');
    }

    /**
     * Salva un nuovo intervento o modifica esistente
     */
    salvaIntervento(event) {
        event.preventDefault();
        
        if (!this.validaForm(this.elements.interventoForm)) {
            this.mostraNotifica('Correggere gli errori nel form', 'danger');
            return;
        }

        this.mostraSpinner(true);

        const editIndex = this.elements.editIndex.value;
        const nuovoIntervento = this.raccogliDatiForm();

        try {
            if (editIndex === '') {
                // Nuovo intervento
                this.interventi.unshift(nuovoIntervento);
                this.mostraNotifica('Intervento salvato con successo', 'success');
            } else {
                // Modifica esistente
                const index = parseInt(editIndex);
                this.storicoModifiche.push({
                    data: new Date().toISOString(),
                    intervento: JSON.parse(JSON.stringify(this.interventi[index])),
                    tipo: 'modifica'
                });
                this.interventi[index] = nuovoIntervento;
                this.mostraNotifica('Intervento modificato con successo', 'success');
            }

            this.resetForm();
            this.salvaDatiStorage();
            this.aggiornaInterfaccia();
        } catch (error) {
            console.error('Errore nel salvataggio:', error);
            this.mostraNotifica('Errore nel salvataggio dell\'intervento', 'danger');
        } finally {
            this.mostraSpinner(false);
        }
    }

    /**
     * Salva le modifiche dal modal
     */
    salvaModifica(event) {
        event.preventDefault();
        
        if (!this.validaForm(this.elements.formModifica)) {
            this.mostraNotifica('Correggere gli errori nel form', 'danger');
            return;
        }

        const index = parseInt(this.elements.editIndexModal.value);
        const nuovoIntervento = this.raccogliDatiFormModal();

        try {
            this.storicoModifiche.push({
                data: new Date().toISOString(),
                intervento: JSON.parse(JSON.stringify(this.interventi[index])),
                tipo: 'modifica'
            });

            this.interventi[index] = nuovoIntervento;
            this.salvaDatiStorage();
            this.aggiornaInterfaccia();
            this.mostraNotifica('Intervento modificato con successo', 'success');
            
            // Chiudi modal
            bootstrap.Modal.getInstance(document.getElementById('modalModifica')).hide();
        } catch (error) {
            console.error('Errore nella modifica:', error);
            this.mostraNotifica('Errore nella modifica dell\'intervento', 'danger');
        }
    }

    /**
     * Raccoglie i dati dal form principale
     */
    raccogliDatiForm() {
        return {
            id: Date.now(),
            asset: this.elements.asset.value.trim(),
            serial: this.elements.serial.value.trim(),
            descrizione: this.elements.descrizione.value.trim(),
            intervento: this.elements.intervento.value.trim(),
            tecnico: this.elements.tecnico.value,
            dataOra: this.elements.dataOra.value,
            stato: this.elements.stato.value,
            dataCreazione: new Date().toISOString()
        };
    }

    /**
     * Raccoglie i dati dal form modal
     */
    raccogliDatiFormModal() {
        return {
            id: this.interventi[parseInt(this.elements.editIndexModal.value)].id,
            asset: this.elements.assetModal.value.trim(),
            serial: this.elements.serialModal.value.trim(),
            descrizione: this.elements.descrizioneModal.value.trim(),
            intervento: this.elements.interventoModal.value.trim(),
            tecnico: this.elements.tecnicoModal.value,
            dataOra: this.elements.dataOraModal.value,
            stato: this.elements.statoModal.value,
            dataCreazione: this.interventi[parseInt(this.elements.editIndexModal.value)].dataCreazione
        };
    }

    /**
     * Valida un form
     */
    validaForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validaCampo(input)) {
                isValid = false;
            }
        });

        form.classList.add('was-validated');
        return isValid;
    }

    /**
     * Reset del form principale
     */
    resetForm() {
        this.elements.interventoForm.reset();
        this.elements.editIndex.value = '';
        this.elements.formTitle.textContent = 'Nuovo Intervento';
        this.resetValidation(this.elements.interventoForm);
        this.impostaDataCorrente();
    }

    /**
     * Modifica un intervento
     */
    modificaIntervento(index) {
        const intervento = this.interventi[index];
        
        // Popola il form principale per modifica inline
        this.elements.editIndex.value = index;
        this.elements.asset.value = intervento.asset;
        this.elements.serial.value = intervento.serial;
        this.elements.descrizione.value = intervento.descrizione;
        this.elements.intervento.value = intervento.intervento;
        this.elements.tecnico.value = intervento.tecnico;
        this.elements.dataOra.value = intervento.dataOra;
        this.elements.stato.value = intervento.stato;
        this.elements.formTitle.textContent = 'Modifica Intervento';

        // Vai al tab nuovo intervento
        const nuovoTab = document.getElementById('nuovo-tab');
        nuovoTab.click();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Modifica un intervento tramite modal
     */
    modificaInterventoModal(index) {
        const intervento = this.interventi[index];
        
        // Popola il form modal
        this.elements.editIndexModal.value = index;
        this.elements.assetModal.value = intervento.asset;
        this.elements.serialModal.value = intervento.serial;
        this.elements.descrizioneModal.value = intervento.descrizione;
        this.elements.interventoModal.value = intervento.intervento;
        this.elements.tecnicoModal.value = intervento.tecnico;
        this.elements.dataOraModal.value = intervento.dataOra;
        this.elements.statoModal.value = intervento.stato;

        // Mostra modal
        new bootstrap.Modal(document.getElementById('modalModifica')).show();
    }

    /**
     * Elimina un intervento
     */
    eliminaIntervento(index) {
        if (index < 0 || index >= this.interventi.length) return;

        const intervento = this.interventi[index];
        this.eliminatoTemp = { ...intervento, index };
        
        this.storicoModifiche.push({
            data: new Date().toISOString(),
            intervento: JSON.parse(JSON.stringify(intervento)),
            tipo: 'eliminazione'
        });

        this.interventi.splice(index, 1);
        this.salvaDatiStorage();
        this.aggiornaInterfaccia();
        this.mostraNotifica('Intervento eliminato', 'info');
    }

    /**
     * Conferma eliminazione
     */
    confermaEliminazione(index) {
        this.indiceEliminazione = index;
        new bootstrap.Modal(document.getElementById('modalConfermaElimina')).show();
    }

    /**
     * Ripristina l'ultimo elemento eliminato
     */
    ripristinaEliminato() {
        if (!this.eliminatoTemp) {
            this.mostraNotifica('Nessun elemento da ripristinare', 'warning');
            return;
        }

        const { index, ...intervento } = this.eliminatoTemp;
        this.interventi.splice(index, 0, intervento);
        this.eliminatoTemp = null;
        this.salvaDatiStorage();
        this.aggiornaInterfaccia();
        this.mostraNotifica('Intervento ripristinato', 'success');
    }

    /**
     * Applica i filtri alla tabella
     */
    applicaFiltri() {
        const filtri = {
            dataInizio: this.elements.filtroInizio.value,
            dataFine: this.elements.filtroFine.value,
            tecnico: this.elements.filtroTecnico.value.toLowerCase(),
            ricerca: this.elements.search.value.toLowerCase()
        };

        this.filtroCorrente = filtri;
        this.paginaCorrente = 1;
        this.aggiornaTabella();
    }

    /**
     * Reset dei filtri
     */
    resetFiltri() {
        this.elements.filtroInizio.value = '';
        this.elements.filtroFine.value = '';
        this.elements.filtroTecnico.value = '';
        this.elements.search.value = '';
        this.filtroCorrente = {};
        this.paginaCorrente = 1;
        this.aggiornaTabella();
    }

    /**
     * Filtra gli interventi
     */
    filtraInterventi() {
        let interventiFiltrati = [...this.interventi];

        // Filtro per data inizio
        if (this.filtroCorrente.dataInizio) {
            interventiFiltrati = interventiFiltrati.filter(intervento => {
                const dataIntervento = new Date(intervento.dataOra).toISOString().split('T')[0];
                return dataIntervento >= this.filtroCorrente.dataInizio;
            });
        }

        // Filtro per data fine
        if (this.filtroCorrente.dataFine) {
            interventiFiltrati = interventiFiltrati.filter(intervento => {
                const dataIntervento = new Date(intervento.dataOra).toISOString().split('T')[0];
                return dataIntervento <= this.filtroCorrente.dataFine;
            });
        }

        // Filtro per tecnico
        if (this.filtroCorrente.tecnico) {
            interventiFiltrati = interventiFiltrati.filter(intervento =>
                intervento.tecnico.toLowerCase().includes(this.filtroCorrente.tecnico)
            );
        }

        // Filtro per ricerca generale
        if (this.filtroCorrente.ricerca) {
            interventiFiltrati = interventiFiltrati.filter(intervento =>
                intervento.asset.toLowerCase().includes(this.filtroCorrente.ricerca) ||
                intervento.serial.toLowerCase().includes(this.filtroCorrente.ricerca) ||
                intervento.descrizione.toLowerCase().includes(this.filtroCorrente.ricerca) ||
                intervento.intervento.toLowerCase().includes(this.filtroCorrente.ricerca)
            );
        }

        return interventiFiltrati;
    }

    /**
     * Ordina la tabella
     */
    ordinaTabella(campo) {
        if (this.ordinamento.campo === campo) {
            this.ordinamento.direzione = this.ordinamento.direzione === 'asc' ? 'desc' : 'asc';
        } else {
            this.ordinamento.campo = campo;
            this.ordinamento.direzione = 'asc';
        }
        this.aggiornaTabella();
    }

    /**
     * Cambia il numero di elementi per pagina
     */
    cambiaElementiPerPagina(nuovoValore) {
        this.elementiPerPagina = parseInt(nuovoValore);
        this.paginaCorrente = 1;
        this.aggiornaTabella();
    }

    /**
     * Aggiorna l'interfaccia completa
     */
    aggiornaInterfaccia() {
        this.aggiornaTabella();
        this.aggiornaStatistiche();
        this.aggiornaContatori();
    }

    /**
     * Aggiorna la tabella degli interventi
     */
    aggiornaTabella() {
        const interventiFiltrati = this.filtraInterventi();
        const interventiOrdinati = this.ordinaInterventi(interventiFiltrati);
        const interventiPaginati = this.paginaInterventi(interventiOrdinati);

        this.popolaTabella(interventiPaginati);
        this.aggiornaPaginazione(interventiFiltrati.length);
        this.aggiornaContatori(interventiFiltrati.length);
    }

    /**
     * Ordina gli interventi
     */
    ordinaInterventi(interventi) {
        return interventi.sort((a, b) => {
            let valoreA = a[this.ordinamento.campo];
            let valoreB = b[this.ordinamento.campo];

            if (this.ordinamento.campo === 'dataOra') {
                valoreA = new Date(valoreA);
                valoreB = new Date(valoreB);
            } else {
                valoreA = valoreA.toString().toLowerCase();
                valoreB = valoreB.toString().toLowerCase();
            }

            if (valoreA < valoreB) {
                return this.ordinamento.direzione === 'asc' ? -1 : 1;
            }
            if (valoreA > valoreB) {
                return this.ordinamento.direzione === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    /**
     * Pagina gli interventi
     */
    paginaInterventi(interventi) {
        const inizio = (this.paginaCorrente - 1) * this.elementiPerPagina;
        const fine = inizio + this.elementiPerPagina;
        return interventi.slice(inizio, fine);
    }

    /**
     * Popola la tabella con i dati
     */
    popolaTabella(interventi) {
        const tbody = this.elements.tabellaInterventi;
        tbody.innerHTML = '';

        if (interventi.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <i class="fas fa-search fa-2x text-muted mb-2"></i>
                        <p class="text-muted">Nessun intervento trovato</p>
                    </td>
                </tr>
            `;
            return;
        }

        interventi.forEach((intervento, index) => {
            const indicePaginato = (this.paginaCorrente - 1) * this.elementiPerPagina + index;
            const indiceReale = this.trovaIndiceReale(intervento);
            
            const tr = document.createElement('tr');
            tr.className = 'fade-in';
            tr.innerHTML = `
                <td>${this.formattaData(intervento.dataOra)}</td>
                <td>${this.truncateText(intervento.asset, 20)}</td>
                <td>${this.truncateText(intervento.serial, 15)}</td>
                <td>${this.truncateText(intervento.descrizione, 30)}</td>
                <td>${this.truncateText(intervento.intervento, 30)}</td>
                <td>${intervento.tecnico}</td>
                <td>${this.getBadgeStato(intervento.stato)}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary" 
                                onclick="app.modificaInterventoModal(${indiceReale})" 
                                title="Modifica">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" 
                                onclick="app.confermaEliminazione(${indiceReale})" 
                                title="Elimina">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button type="button" class="btn btn-outline-info" 
                                onclick="app.mostraStorico(${indiceReale})" 
                                title="Storico">
                            <i class="fas fa-history"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * Trova l'indice reale di un intervento nell'array principale
     */
    trovaIndiceReale(intervento) {
        return this.interventi.findIndex(i => i.id === intervento.id);
    }

    /**
     * Aggiorna la paginazione
     */
    aggiornaPaginazione(totaleElementi) {
        const totalePagine = Math.ceil(totaleElementi / this.elementiPerPagina);
        const paginazione = this.elements.pagination;
        paginazione.innerHTML = '';

        if (totalePagine <= 1) return;

        // Pulsante precedente
        const precedente = document.createElement('li');
        precedente.className = `page-item${this.paginaCorrente === 1 ? ' disabled' : ''}`;
        precedente.innerHTML = `
            <a class="page-link" href="#" onclick="app.vaiPagina(${this.paginaCorrente - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        `;
        paginazione.appendChild(precedente);

        // Numeri di pagina
        const inizio = Math.max(1, this.paginaCorrente - 2);
        const fine = Math.min(totalePagine, this.paginaCorrente + 2);

        for (let i = inizio; i <= fine; i++) {
            const pagina = document.createElement('li');
            pagina.className = `page-item${i === this.paginaCorrente ? ' active' : ''}`;
            pagina.innerHTML = `
                <a class="page-link" href="#" onclick="app.vaiPagina(${i})">${i}</a>
            `;
            paginazione.appendChild(pagina);
        }

        // Pulsante successivo
        const successivo = document.createElement('li');
        successivo.className = `page-item${this.paginaCorrente === totalePagine ? ' disabled' : ''}`;
        successivo.innerHTML = `
            <a class="page-link" href="#" onclick="app.vaiPagina(${this.paginaCorrente + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        `;
        paginazione.appendChild(successivo);
    }

    /**
     * Vai a una pagina specifica
     */
    vaiPagina(numeroPagina) {
        const interventiFiltrati = this.filtraInterventi();
        const totalePagine = Math.ceil(interventiFiltrati.length / this.elementiPerPagina);
        
        if (numeroPagina >= 1 && numeroPagina <= totalePagine) {
            this.paginaCorrente = numeroPagina;
            this.aggiornaTabella();
        }
    }

    /**
     * Aggiorna i contatori
     */
    aggiornaContatori(elementiFiltrati = null) {
        const totale = this.interventi.length;
        const visibili = elementiFiltrati !== null ? elementiFiltrati : totale;

        this.elements.contatoreTotale.textContent = `${totale} interventi`;
        this.elements.contatoreVisibili.textContent = `Mostrando ${visibili} di ${totale} interventi`;
    }

    /**
     * Aggiorna le statistiche
     */
    aggiornaStatistiche() {
        const totali = this.interventi.length;
        const inProgress = this.interventi.filter(i => i.stato === 'InProgress').length;
        const closed = this.interventi.filter(i => i.stato === 'Closed').length;
        const tecnici = this.tecnici.length;

        this.elements.statTotali.textContent = totali;
        this.elements.statInProgress.textContent = inProgress;
        this.elements.statClosed.textContent = closed;
        this.elements.statTecnici.textContent = tecnici;
    }

    /**
     * Formatta una data per la visualizzazione
     */
    formattaData(dataString) {
        const data = new Date(dataString);
        return data.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Tronca il testo se troppo lungo
     */
    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    /**
     * Restituisce il badge per lo stato
     */
    getBadgeStato(stato) {
        const classi = {
            'InProgress': 'bg-warning text-dark',
            'Closed': 'bg-success'
        };
        return `<span class="badge ${classi[stato] || 'bg-secondary'}">${stato}</span>`;
    }

    /**
     * Mostra/nasconde lo spinner di caricamento
     */
    mostraSpinner(mostra) {
        this.elements.loadingSpinner.classList.toggle('d-none', !mostra);
        this.elements.interventoForm.classList.toggle('d-none', mostra);
    }

    /**
     * Mostra una notifica toast
     */
    mostraNotifica(messaggio, tipo = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${tipo} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${messaggio}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        this.elements.toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        
        bsToast.show();
        
        // Rimuovi il toast dal DOM dopo che è nascosto
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    /**
     * Mostra lo storico delle modifiche
     */
    mostraStorico(index) {
        const intervento = this.interventi[index];
        const storico = this.storicoModifiche.filter(s => s.intervento.id === intervento.id);
        
        const modalStorico = document.getElementById('modalStorico');
        const storicoContent = document.getElementById('storicoContent');
        
        if (storico.length === 0) {
            storicoContent.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Nessuna modifica registrata per questo intervento.
                </div>
            `;
        } else {
            storicoContent.innerHTML = storico.map(s => `
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-${s.tipo === 'modifica' ? 'edit' : 'trash'} me-2"></i>
                            ${s.tipo === 'modifica' ? 'Modifica' : 'Eliminazione'} - 
                            ${this.formattaData(s.data)}
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Asset:</strong> ${s.intervento.asset}
                            </div>
                            <div class="col-md-6">
                                <strong>Serial:</strong> ${s.intervento.serial}
                            </div>
                            <div class="col-12 mt-2">
                                <strong>Problematica:</strong> ${s.intervento.descrizione}
                            </div>
                            <div class="col-12 mt-2">
                                <strong>Intervento:</strong> ${s.intervento.intervento}
                            </div>
                            <div class="col-md-6 mt-2">
                                <strong>Tecnico:</strong> ${s.intervento.tecnico}
                            </div>
                            <div class="col-md-6 mt-2">
                                <strong>Stato:</strong> ${this.getBadgeStato(s.intervento.stato)}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        new bootstrap.Modal(modalStorico).show();
    }

    /**
     * Esporta i dati in Excel
     */
    esportaExcel() {
        try {
            const interventiFiltrati = this.filtraInterventi();
            const datiExport = interventiFiltrati.map(intervento => ({
                'Data e Ora': this.formattaData(intervento.dataOra),
                'Asset': intervento.asset,
                'Serial Number': intervento.serial,
                'Problematica': intervento.descrizione,
                'Intervento': intervento.intervento,
                'Tecnico': intervento.tecnico,
                'Stato': intervento.stato
            }));

            const ws = XLSX.utils.json_to_sheet(datiExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Interventi');
            
            const filename = `interventi_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, filename);
            
            this.mostraNotifica('File Excel esportato con successo', 'success');
        } catch (error) {
            console.error('Errore nell\'esportazione Excel:', error);
            this.mostraNotifica('Errore nell\'esportazione Excel', 'danger');
        }
    }

    /**
     * Esporta i dati in PDF
     */
    esportaPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Titolo
            doc.setFontSize(20);
            doc.text('Rapporto Interventi', 14, 20);
            
            // Data di generazione
            doc.setFontSize(12);
            doc.text(`Generato il: ${new Date().toLocaleDateString('it-IT')}`, 14, 30);
            
            // Tabella
            const interventiFiltrati = this.filtraInterventi();
            const datiTabella = interventiFiltrati.map(intervento => [
                this.formattaData(intervento.dataOra),
                intervento.asset,
                intervento.serial,
                this.truncateText(intervento.descrizione, 30),
                this.truncateText(intervento.intervento, 30),
                intervento.tecnico,
                intervento.stato
            ]);
            
            doc.autoTable({
                head: [['Data/Ora', 'Asset', 'Serial', 'Problematica', 'Intervento', 'Tecnico', 'Stato']],
                body: datiTabella,
                startY: 40,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 139, 202] }
            });
            
            const filename = `interventi_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            
            this.mostraNotifica('File PDF esportato con successo', 'success');
        } catch (error) {
            console.error('Errore nell\'esportazione PDF:', error);
            this.mostraNotifica('Errore nell\'esportazione PDF', 'danger');
        }
    }

    /**
     * Esporta tutti i dati del sistema
     */
    esportaDati() {
        try {
            const datiCompleti = {
                interventi: this.interventi,
                tecnici: this.tecnici,
                storico: this.storicoModifiche,
                esportato: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(datiCompleti, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_interventi_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.mostraNotifica('Backup esportato con successo', 'success');
        } catch (error) {
            console.error('Errore nell\'esportazione dati:', error);
            this.mostraNotifica('Errore nell\'esportazione dati', 'danger');
        }
    }

    /**
     * Importa dati dal file
     */
    importaDati(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dati = JSON.parse(e.target.result);
                
                if (dati.interventi && Array.isArray(dati.interventi)) {
                    this.interventi = dati.interventi;
                }
                if (dati.tecnici && Array.isArray(dati.tecnici)) {
                    this.tecnici = dati.tecnici;
                }
                if (dati.storico && Array.isArray(dati.storico)) {
                    this.storicoModifiche = dati.storico;
                }
                
                this.salvaDatiStorage();
                this.caricaTecnici();
                this.aggiornaInterfaccia();
                this.mostraNotifica('Dati importati con successo', 'success');
            } catch (error) {
                console.error('Errore nell\'importazione:', error);
                this.mostraNotifica('Errore nel file di importazione', 'danger');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Elimina tutti i dati
     */
    eliminaTuttiDati() {
        if (confirm('Sei sicuro di voler eliminare tutti i dati? Questa azione non può essere annullata.')) {
            this.interventi = [];
            this.storicoModifiche = [];
            this.eliminatoTemp = null;
            this.salvaDatiStorage();
            this.aggiornaInterfaccia();
            this.mostraNotifica('Tutti i dati sono stati eliminati', 'warning');
        }
    }
}

// Inizializzazione globale
document.addEventListener('DOMContentLoaded', function() {
    window.app = new GestioneInterventi();
});
