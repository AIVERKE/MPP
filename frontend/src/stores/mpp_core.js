import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

export const useMppCoreStore = defineStore("mpp_core", () => {
    const unidades = ref([]);
    const cargos = ref([]);
    const procesos = ref([]);
    const procedimientos = ref([]);
    const cargoProcesos = ref([]);
    const acciones = ref([]);
    const figuras = ref([]); 
    const pasos = ref([]); 
    const operaciones = ref([]); 
    
    const riesgos = ref([]);
    const controles = ref([]);
    const requisitos = ref([]);
    const normativas = ref([]);
    const indicadores = ref([]);
    const equipos = ref([]);
    const instalaciones = ref([]);
    const sistemasInformacion = ref([]);
    const documentosReferencia = ref([]);

    // --- REGISTRO DE ESQUEMAS ---
    const schemas = ref({
        proceso: {
            title: "Proceso",
            icon: "mdi-hexagon-multiple",
            fields: [
                { key: "nombre", label: "Nombre del Proceso", type: "text", required: true },
                { key: "codigo", label: "Código Único", type: "text" },
                { key: "descripcion", label: "Descripción Detallada", type: "textarea" }
            ],
            endpoints: { save: "procesos", update: "procesos", fetch: "procesos" }
        },
        procedimiento: {
            title: "Procedimiento",
            icon: "mdi-file-edit",
            fields: [
                { key: "nombre", label: "Nombre del Procedimiento", type: "text", required: true },
                { key: "codigo", label: "Código Único", type: "text" },
                { key: "id_proceso", label: "Proceso Padre", type: "hidden" },
                { key: "objetivos", label: "Objetivos", type: "textarea" },
                { key: "alcance", label: "Alcance", type: "textarea" },
                { key: "periodicidad", label: "Periodicidad", type: "text" },
                { key: "estado_version", label: "Estado de Versión", type: "select", options: ["Borrador", "En revisión", "Aprobado", "Renovado"], default: "Borrador" },
                { key: "version", label: "Versión (automática)", type: "readonly" },
                { key: "estado", label: "Estado", type: "select", options: ["Activo", "Inactivo", "En Revisión"], default: "Activo" },
                { key: "id_instalaciones", label: "Instalaciones", type: "select-multiple", optionsSource: "instalaciones", itemTitle: "nombre", itemValue: "id_instalacion" }
            ],
            endpoints: { save: "procedimientos", update: "procedimientos", fetch: "procedimientos" }
        },
        normativa: {
            title: "Marco Normativo",
            icon: "mdi-gavel",
            fields: [
                { key: "nombre", label: "Nombre de la Norma", type: "text", required: true },
                { key: "codigo", label: "Código / Referencia", type: "text" },
                { key: "url", label: "Enlace al Documento", type: "text" },
                { key: "fecha_emision", label: "Fecha de Emisión", type: "date" },
                { key: "descripcion", label: "Resumen / Detalle", type: "textarea" }
            ],
            endpoints: { save: "normativas", update: "normativas", fetch: "normativas" },
            parentLink: { key: "id_procedimientos", type: "array" }
        },
        accion: {
            title: "Acción / Verbo",
            icon: "mdi-play-network-outline",
            fields: [
                { key: "nombre_accion", label: "Nombre de la Acción (Verbo)", type: "text", required: true },
                { key: "id_figura", label: "Figura Visual", type: "select", optionsSource: "figuras", itemTitle: "nombre", itemValue: "id_figura", required: true }
            ],
            endpoints: { save: "acciones", update: "acciones", fetch: "acciones" }
        }
    });

    const currentContext = ref({ unidad: null, proceso: null, subproceso: null, procedimiento: null });
    const loading = ref(false);
    const error = ref(null);

    const BASE_URL_MPP = "http://localhost:3000/procesos";
    const BASE_URL_FLUX = "http://localhost:3000/flujo";
    const BASE_URL_ORG = "http://localhost:3000/estructura-organizacional";
    const BASE_URL_REC = "http://localhost:3000/recursos";
    const BASE_URL_CAL = "http://localhost:3000/calidad";
    const BASE_URL_MOF = "http://localhost:3000/mof";

    // --- LECTURA ---
    const fetchAcciones = async () => {
        loading.value = true;
        try {
            const response = await axios.get(`${BASE_URL_FLUX}/acciones`);
            acciones.value = response.data.data || response.data;
        } catch (err) { error.value = err.message; }
        finally { loading.value = false; }
    };

    const fetchFiguras = async () => {
        loading.value = true;
        try {
            const response = await axios.get(`${BASE_URL_FLUX}/figuras`);
            figuras.value = response.data.data || response.data;
        } catch (err) { error.value = err.message; }
        finally { loading.value = false; }
    };

    const fetchUnidades = async () => {
        loading.value = true;
        try {
            const response = await axios.get(`${BASE_URL_ORG}/unidades`);
            unidades.value = response.data.data || response.data;
        } catch (err) { error.value = err.message; }
        finally { loading.value = false; }
    };

    const fetchInstalaciones = async () => {
        loading.value = true;
        try {
            const response = await axios.get(`${BASE_URL_ORG}/instalaciones`);
            instalaciones.value = response.data.data || response.data;
        } catch (err) { error.value = err.message; }
        finally { loading.value = false; }
    };

    const fetchCargos = async () => {
        loading.value = true;
        try {
            const response = await axios.get(`${BASE_URL_ORG}/cargos`);
            cargos.value = response.data.data || response.data;
        } catch (err) { error.value = err.message; }
        finally { loading.value = false; }
    };

    const fetchProcesos = async () => {
        loading.value = true;
        try {
            await Promise.all([fetchUnidades(), fetchInstalaciones()]);
            const response = await axios.get(`${BASE_URL_MPP}/procesos`);
            procesos.value = response.data.data || response.data;
        } catch (err) { error.value = err.message; }
        finally { loading.value = false; }
    };

    const fetchProcedimientos = async (procesoId) => {
        loading.value = true;
        const targetId = Number(procesoId);
        try {
            const response = await axios.get(`${BASE_URL_MPP}/procedimientos`);
            const all = response.data.data || response.data;
            procedimientos.value = all.filter(p => {
                const pId = p.proceso?.id_proceso || p.id_proceso || p.proceso;
                return Number(pId) === targetId;
            });
        } catch (err) { error.value = err.message; }
        finally { loading.value = false; }
    };

    const fetchCargoProcesos = async (procesoId) => {
        loading.value = true;
        const targetId = Number(procesoId);
        try {
            const response = await axios.get(`${BASE_URL_MPP}/cargo-procesos`);
            const all = response.data.data || response.data;
            cargoProcesos.value = all.filter(cp => {
                const cpId = cp.proceso?.id_proceso || cp.id_proceso || cp.proceso;
                return Number(cpId) === targetId;
            });
        } catch (err) { error.value = err.message; }
        finally { loading.value = false; }
    };

    const fetchOperaciones = async () => {
        loading.value = true;
        try {
            const response = await axios.get(`${BASE_URL_FLUX}/operaciones`);
            operaciones.value = response.data.data || response.data;
        } catch (err) { error.value = err.message; }
        finally { loading.value = false; }
    };

    const fetchPasos = async (procedimientoId) => {
        loading.value = true;
        try {
            const response = await axios.get(`${BASE_URL_FLUX}/pasos/procedimiento/${procedimientoId}`);
            pasos.value = response.data.data || response.data;
            return pasos.value;
        } catch (err) { error.value = err.message; return []; }
        finally { loading.value = false; }
    };

    const fetchRiesgos = () => axios.get(`${BASE_URL_REC}/riesgos`).then(r => riesgos.value = r.data.data || r.data);
    const fetchControles = () => axios.get(`${BASE_URL_REC}/controles`).then(r => controles.value = r.data.data || r.data);
    const fetchRequisitos = () => axios.get(`${BASE_URL_REC}/requisitos`).then(r => requisitos.value = r.data.data || r.data);
    const fetchNormativas = () => axios.get(`${BASE_URL_CAL}/normativas`).then(r => normativas.value = r.data.data || r.data);
    const fetchIndicadores = () => axios.get(`${BASE_URL_CAL}/indicadores`).then(r => indicadores.value = r.data.data || r.data);
    const fetchEquipos = () => axios.get(`${BASE_URL_REC}/equipos`).then(r => equipos.value = r.data.data || r.data);
    const fetchSistemasInformacion = () => axios.get(`${BASE_URL_REC}/sistemas-informacion`).then(r => sistemasInformacion.value = r.data.data || r.data);
    const fetchDocumentosReferencia = () => axios.get(`${BASE_URL_REC}/documentos-referencia`).then(r => documentosReferencia.value = r.data.data || r.data);

    const syncUnidades = async () => {
        try {
            const response = await axios.post(`${BASE_URL_MOF}/sync`);
            return response.status === 201;
        } catch (e) { console.error(e); return false; }
    };

    const syncCargos = async () => {
        try {
            const response = await axios.post(`${BASE_URL_MOF}/cargos/sync`);
            return response.status === 201;
        } catch (e) { console.error(e); return false; }
    };

    // --- ESCRITURA ---
    const saveProceso = (data) => axios.post(`${BASE_URL_MPP}/procesos`, data).then(r => r.data);
    const updateProceso = (id, data) => axios.patch(`${BASE_URL_MPP}/procesos/${id}`, data);
    const deleteProceso = (id) => axios.delete(`${BASE_URL_MPP}/procesos/${id}`);

    const saveProcedimiento = (data) => axios.post(`${BASE_URL_MPP}/procedimientos`, data).then(r => r.data);
    const updateProcedimiento = (id, data) => axios.patch(`${BASE_URL_MPP}/procedimientos/${id}`, data);
    const deleteProcedimiento = (id) => axios.delete(`${BASE_URL_MPP}/procedimientos/${id}`);

    const saveCargoProceso = (data) => axios.post(`${BASE_URL_MPP}/cargo-procesos`, data);
    const updateCargoProceso = (id, data) => axios.patch(`${BASE_URL_MPP}/cargo-procesos/${id}`, data);
    const deleteCargoProceso = (id) => axios.delete(`${BASE_URL_MPP}/cargo-procesos/${id}`);

    const saveRiesgo = (data) => axios.post(`${BASE_URL_REC}/riesgos`, data);
    const updateRiesgo = (id, data) => axios.patch(`${BASE_URL_REC}/riesgos/${id}`, data);
    const deleteRiesgo = (id) => axios.delete(`${BASE_URL_REC}/riesgos/${id}`);

    const saveControl = (data) => axios.post(`${BASE_URL_REC}/controles`, data);
    const updateControl = (id, data) => axios.patch(`${BASE_URL_REC}/controles/${id}`, data);
    const deleteControl = (id) => axios.delete(`${BASE_URL_REC}/controles/${id}`);

    const saveRequisito = (data) => axios.post(`${BASE_URL_REC}/requisitos`, data);
    const updateRequisito = (id, data) => axios.patch(`${BASE_URL_REC}/requisitos/${id}`, data);
    const deleteRequisito = (id) => axios.delete(`${BASE_URL_REC}/requisitos/${id}`);

    const saveNormativa = (data) => axios.post(`${BASE_URL_CAL}/normativas`, data);
    const updateNormativa = (id, data) => axios.patch(`${BASE_URL_CAL}/normativas/${id}`, data);
    const deleteNormativa = (id) => axios.delete(`${BASE_URL_CAL}/normativas/${id}`);

    const saveIndicador = (data) => axios.post(`${BASE_URL_CAL}/indicadores`, data);
    const updateIndicador = (id, data) => axios.patch(`${BASE_URL_CAL}/indicadores/${id}`, data);
    const deleteIndicador = (id) => axios.delete(`${BASE_URL_CAL}/indicadores/${id}`);

    const saveEquipo = (data) => axios.post(`${BASE_URL_REC}/equipos`, data);
    const updateEquipo = (id, data) => axios.patch(`${BASE_URL_REC}/equipos/${id}`, data);
    const deleteEquipo = (id) => axios.delete(`${BASE_URL_REC}/equipos/${id}`);

    const saveSistemaInformacion = (data) => axios.post(`${BASE_URL_REC}/sistemas-informacion`, data);
    const updateSistemaInformacion = (id, data) => axios.patch(`${BASE_URL_REC}/sistemas-informacion/${id}`, data);
    const deleteSistemaInformacion = (id) => axios.delete(`${BASE_URL_REC}/sistemas-informacion/${id}`);

    const saveAccion = (data) => axios.post(`${BASE_URL_FLUX}/acciones`, data);
    const updateAccion = (id, data) => axios.patch(`${BASE_URL_FLUX}/acciones/${id}`, data);
    const deleteAccion = (id) => axios.delete(`${BASE_URL_FLUX}/acciones/${id}`);

    const saveFlujoCompleto = async (procedimientoId, listaPasos) => {
        localStorage.setItem(`mpp_flow_${procedimientoId}`, JSON.stringify(listaPasos));
        return true;
    };

    const saveMatrixRow = async (row, procedimientoId) => {
        console.log(`📡 [API-Store] saveMatrixRow - Fila: ${row.nro}, responsableCargoId: ${row.responsableCargoId}, savedIds:`, JSON.stringify(row.savedIds));
        try {
            const savedIds = row.savedIds || {};
            const pId = Number(procedimientoId);

            // 1. Operación
            const opData = { id_procedimiento: pId, orden: Number(row.nro), salida: row.salida || "", plazo: Number(row.plazo || 0) };
            let opId = savedIds.operacion ? Number(savedIds.operacion) : null;
            if (opId) {
                console.log(`📡 [API-Store] PATCH /operaciones/${opId} con data:`, JSON.stringify(opData));
                await axios.patch(`${BASE_URL_FLUX}/operaciones/${opId}`, opData);
            } else {
                console.log(`📡 [API-Store] POST /operaciones con data:`, JSON.stringify(opData));
                const res = await axios.post(`${BASE_URL_FLUX}/operaciones`, opData);
                opId = Number(res.data.data?.id_operaciones || res.data.id_operaciones || res.data.id);
                console.log(`📡 [API-Store] Operación creada con ID: ${opId}`);
            }

            // 2. Actividad
            const actData = { id_operaciones: opId, descripcion: row.actividad || "Sin descripción", orden: 1 };
            let actId = savedIds.actividad ? Number(savedIds.actividad) : null;
            if (actId) {
                console.log(`📡 [API-Store] PATCH /actividades/${actId} con data:`, JSON.stringify(actData));
                await axios.patch(`${BASE_URL_FLUX}/actividades/${actId}`, actData);
            } else {
                console.log(`📡 [API-Store] POST /actividades con data:`, JSON.stringify(actData));
                const res = await axios.post(`${BASE_URL_FLUX}/actividades`, actData);
                actId = Number(res.data.data?.id_actividad || res.data.id_actividad || res.data.id);
                console.log(`📡 [API-Store] Actividad creada con ID: ${actId}`);
            }

            // 3. Tarea
            let tareaId = savedIds.tarea ? Number(savedIds.tarea) : null;
            if (row.accionId && actId) {
                const tareaData = { 
                    id_actividad: actId, 
                    id_accion: Number(row.accionId), 
                    descripcion: (row.tarea || "Nueva Tarea").trim(), 
                    texto_figura: (row.texto_figura || row.tarea || "Nueva Tarea").trim(),
                    orden: 1 
                };
                if (tareaId) {
                    console.log(`📡 [API-Store] PATCH /tareas/${tareaId} con data:`, JSON.stringify(tareaData));
                    await axios.patch(`${BASE_URL_FLUX}/tareas/${tareaId}`, tareaData);
                } else {
                    console.log(`📡 [API-Store] POST /tareas con data:`, JSON.stringify(tareaData));
                    const res = await axios.post(`${BASE_URL_FLUX}/tareas`, tareaData);
                    tareaId = Number(res.data.data?.id_tarea || res.data.id_tarea || res.data.id);
                    console.log(`📡 [API-Store] Tarea creada con ID: ${tareaId}`);
                }
            } else if (tareaId) {
                console.log(`📡 [API-Store] DELETE /tareas/${tareaId} (acción vacía o actividad ausente)`);
                await axios.delete(`${BASE_URL_FLUX}/tareas/${tareaId}`).catch(() => {});
                tareaId = null;
            }

            // 4. Responsable
            let respId = savedIds.responsable ? Number(savedIds.responsable) : null;
            if (row.responsableCargoId) {
                const respData = { id_operacion: opId, id_cargo: Number(row.responsableCargoId), tipo_participacion: 'Responsable' };
                if (respId) {
                    console.log(`🔄 [API-Store] Cambiando Cargo Responsable. Eliminando anterior relacion ID: ${respId} y creando nueva relacion para Cargo: ${row.responsableCargoId}`);
                    await axios.delete(`${BASE_URL_FLUX}/operacion-cargos/${respId}`).catch((err) => {
                        console.warn(`⚠️ [API-Store] Falló DELETE /operacion-cargos/${respId} (probablemente ya borrado).`, err.message);
                    });
                    console.log(`📡 [API-Store] POST /operacion-cargos con data:`, JSON.stringify(respData));
                    const res = await axios.post(`${BASE_URL_FLUX}/operacion-cargos`, respData);
                    respId = Number(res.data.data?.id || res.data.id);
                    console.log(`✨ [API-Store] Nueva relación Responsable creada con ID: ${respId}`);
                } else {
                    console.log(`➕ [API-Store] Creando Asignación de Cargo Responsable. POST /operacion-cargos con data:`, JSON.stringify(respData));
                    const res = await axios.post(`${BASE_URL_FLUX}/operacion-cargos`, respData);
                    respId = Number(res.data.data?.id || res.data.id);
                    console.log(`✨ [API-Store] Relación Responsable creada con ID: ${respId}`);
                }
            } else if (respId) {
                console.log(`➖ [API-Store] Eliminando Cargo Responsable anterior. DELETE /operacion-cargos/${respId}`);
                await axios.delete(`${BASE_URL_FLUX}/operacion-cargos/${respId}`).catch((err) => {
                    console.warn(`⚠️ [API-Store] Falló DELETE /operacion-cargos/${respId}`, err.message);
                });
                respId = null;
            }

            // 5. Recursos (Riesgos, Controles, Requisitos, Referencia, Solicitante)
            const saveResource = async (val, existingId, endpoint, extraData = {}) => {
                try {
                    if (val && val.trim()) {
                        const data = { descripcion: val, id_operacion: opId, ...extraData };
                        if (existingId && !isNaN(existingId)) {
                            await axios.patch(`${BASE_URL_REC}/${endpoint}/${existingId}`, data);
                            return Number(existingId);
                        } else {
                            const res = await axios.post(`${BASE_URL_REC}/${endpoint}`, data);
                            const raw = res.data.data || res.data;
                            // Intentar capturar cualquier variante de ID
                            const newId = raw.id || raw[`id_${endpoint}`] || raw.id_requisitos || raw.id_riesgo || raw.id_control;
                            console.log(`[Store] ${endpoint} creado con ID:`, newId);
                            return Number(newId);
                        }
                    } else if (existingId && !isNaN(existingId)) {
                        console.log(`[Store] Borrando ${endpoint} ID: ${existingId}`);
                        await axios.delete(`${BASE_URL_REC}/${endpoint}/${existingId}`).catch(() => {});
                    }
                } catch (e) {
                    console.error(`[Store] Error en saveResource (${endpoint}):`, e);
                }
                return null;
            };

            const riesgoId = await saveResource(row.riesgo, savedIds.riesgo, 'riesgos');
            const controlId = await saveResource(row.control, savedIds.control, 'controles');
            const requisitoId = await saveResource(row.requisitos, savedIds.requisito, 'requisitos', { tipo_entrada: 'entrada' });
            const solicitanteId = await saveResource(row.solicitante, savedIds.solicitante, 'requisitos', { tipo_entrada: 'solicitante' });

            // Referencia Especial (Nombre vs Descripcion)
            let refId = savedIds.referencia ? Number(savedIds.referencia) : null;
            if (row.referencia) {
                const refData = { nombre: row.referencia, id_operaciones: [opId] };
                if (refId) await axios.patch(`${BASE_URL_REC}/documentos-referencia/${refId}`, refData);
                else {
                    const res = await axios.post(`${BASE_URL_REC}/documentos-referencia`, refData);
                    refId = Number(res.data.data?.id || res.data.id || res.data.id_documento_referencia);
                }
            } else if (refId) {
                await axios.delete(`${BASE_URL_REC}/documentos-referencia/${refId}`).catch(() => {});
                refId = null;
            }

            return { operacion: opId, actividad: actId, tarea: tareaId, responsable: respId, riesgo: riesgoId, control: controlId, requisito: requisitoId, referencia: refId, solicitante: solicitanteId };
        } catch (err) { console.error("Error orquestando guardado:", err); throw err; }
    };

    const fetchMatrixData = async (procedimientoId) => {
        console.log(`📡 [API-Store] Iniciando fetchMatrixData para procedimiento ID: ${procedimientoId}`);
        loading.value = true;
        try {
            const pId = Number(procedimientoId);
            const [opRes, actRes, tarRes, cargoRes, riesgosRes, controlesRes, reqRes, refRes] = await Promise.all([
                axios.get(`${BASE_URL_FLUX}/operaciones`).catch(() => ({ data: [] })),
                axios.get(`${BASE_URL_FLUX}/actividades`).catch(() => ({ data: [] })),
                axios.get(`${BASE_URL_FLUX}/tareas`).catch(() => ({ data: [] })),
                axios.get(`${BASE_URL_FLUX}/operacion-cargos`).catch(() => ({ data: [] })),
                axios.get(`${BASE_URL_REC}/riesgos`).catch(() => ({ data: [] })),
                axios.get(`${BASE_URL_REC}/controles`).catch(() => ({ data: [] })),
                axios.get(`${BASE_URL_REC}/requisitos`).catch(() => ({ data: [] })),
                axios.get(`${BASE_URL_REC}/documentos-referencia`).catch(() => ({ data: [] }))
            ]);

            const getData = (res) => {
                const raw = res.data?.data || res.data || [];
                return Array.isArray(raw) ? raw : [];
            };

            const allActs = getData(actRes);
            const allTasks = getData(tarRes);
            const allOpCargos = getData(cargoRes);
            const allRiesgos = getData(riesgosRes);
            const allControles = getData(controlesRes);
            const allReqs = getData(reqRes);
            const allRefs = getData(refRes);

            const matrixOps = getData(opRes).filter(op => {
                const opProcId = op.id_procedimiento || (op.procedimiento && (op.procedimiento.id_procedimiento || op.procedimiento.id));
                return Number(opProcId) === pId;
            });

            const mappedRows = matrixOps.map(op => {
                const idOp = Number(op.id_operaciones || op.id);
                
                // Helpers para extraer IDs de objetos de relacion del backend
                const getOpId = (item) => Number(item?.id_operacion || item?.operacion?.id_operaciones || item?.operacion?.id);
                const getActId = (item) => Number(item?.id_actividad || item?.actividad?.id_actividad || item?.actividad?.id);

                const actividad = allActs.find(a => Number(a.id_operaciones || a.operacion?.id_operaciones) === idOp) || {};
                const idAct = Number(actividad.id_actividad || actividad.id);
                
                const tarea = idAct ? (allTasks.find(t => getActId(t) === idAct) || {}) : {};
                const responsable = allOpCargos.find(oc => getOpId(oc) === idOp && oc.tipo_participacion === 'Responsable') || {};
                const riesgo = allRiesgos.find(r => getOpId(r) === idOp) || {};
                const control = allControles.find(c => getOpId(c) === idOp) || {};
                
                const todosReqs = allReqs.filter(req => getOpId(req) === idOp);
                const reqEntrada = todosReqs.find(req => !req.tipo_entrada || req.tipo_entrada === 'entrada') || {};
                const solicitanteReq = todosReqs.find(req => req.tipo_entrada === 'solicitante') || {};
                const referencia = allRefs.find(ref => Array.isArray(ref.operaciones) && ref.operaciones.some(o => Number(o.id_operaciones || o.id) === idOp)) || {};

                return {
                    id: `db-${idOp}`, nro: op.orden || 1, requisitos: reqEntrada.descripcion || "", actividad: actividad.descripcion || "",
                    tarea: tarea.descripcion || "", texto_figura: tarea.texto_figura || tarea.descripcion || "", referencia: referencia.nombre || "", solicitante: solicitanteReq.descripcion || "",
                    riesgo: riesgo.descripcion || "", control: control.descripcion || "",
                    salida: op.salida || "", plazo: op.plazo || 0, accionId: tarea.id_accion || null, responsableCargoId: responsable.id_cargo || null,
                    status: 'idle',
                    savedIds: {
                        operacion: idOp, actividad: idAct || null, tarea: tarea.id_tarea || null, responsable: responsable.id || null,
                        riesgo: riesgo.id_riesgo || null, control: control.id_control || null, requisito: reqEntrada.id_requisitos || null,
                        referencia: referencia.id_documento_referencia || null, solicitante: solicitanteReq.id_requisitos || null
                    }
                };
            });

            return mappedRows.sort((a, b) => a.nro - b.nro);
        } catch (err) { console.error("[Store] Fallo en carga:", err); return []; }
        finally { loading.value = false; }
    };

    const deleteMatrixRow = async (savedIds) => {
        try {
            if (!savedIds || !savedIds.operacion) return;
            const opId = savedIds.operacion;
            if (savedIds.riesgo) await axios.delete(`${BASE_URL_REC}/riesgos/${savedIds.riesgo}`).catch(() => {});
            if (savedIds.control) await axios.delete(`${BASE_URL_REC}/controles/${savedIds.control}`).catch(() => {});
            if (savedIds.requisito) await axios.delete(`${BASE_URL_REC}/requisitos/${savedIds.requisito}`).catch(() => {});
            if (savedIds.solicitante) await axios.delete(`${BASE_URL_REC}/requisitos/${savedIds.solicitante}`).catch(() => {});
            if (savedIds.referencia) await axios.delete(`${BASE_URL_REC}/documentos-referencia/${savedIds.referencia}`).catch(() => {});
            if (savedIds.responsable) await axios.delete(`${BASE_URL_FLUX}/operacion-cargos/${savedIds.responsable}`).catch(() => {});
            if (savedIds.tarea) await axios.delete(`${BASE_URL_FLUX}/tareas/${savedIds.tarea}`).catch(() => {});
            if (savedIds.actividad) await axios.delete(`${BASE_URL_FLUX}/actividades/${savedIds.actividad}`).catch(() => {});
            await axios.delete(`${BASE_URL_FLUX}/operaciones/${opId}`);
            return true;
        } catch (err) { throw err; }
    };

    const saveEntity = async (type, data) => {
        const schema = schemas.value[type];
        const payload = { ...data };
        schema.fields
            .filter((field) => field.type === "readonly")
            .forEach((field) => delete payload[field.key]);
        let baseUrl = schema.endpoints.save === "normativas" ? BASE_URL_CAL : BASE_URL_MPP;
        const res = await axios.post(`${baseUrl}/${schema.endpoints.save}`, payload);
        return res.data.data || res.data;
    };

    const updateEntity = async (type, id, data) => {
        const schema = schemas.value[type];
        const payload = { ...data };
        schema.fields
            .filter((field) => field.type === "readonly")
            .forEach((field) => delete payload[field.key]);
        let baseUrl = schema.endpoints.update === "normativas" ? BASE_URL_CAL : BASE_URL_MPP;
        const res = await axios.patch(`${baseUrl}/${schema.endpoints.update}/${id}`, payload);
        return res.data.data || res.data;
    };

    const deleteEntity = async (type, id) => {
        const schema = schemas.value[type];
        let baseUrl = schema.endpoints.save === "normativas" ? BASE_URL_CAL : BASE_URL_MPP;
        return await axios.delete(`${baseUrl}/${schema.endpoints.save}/${id}`);
    };

    return {
        unidades, cargos, procesos, procedimientos, cargoProcesos, pasos, operaciones, acciones, figuras,
        riesgos, controles, requisitos, normativas, indicadores, equipos, instalaciones, sistemasInformacion, documentosReferencia,
        currentContext, loading, error, schemas,
        fetchUnidades, fetchRiesgos, fetchControles, fetchRequisitos, fetchNormativas, fetchIndicadores, fetchEquipos, fetchInstalaciones, fetchSistemasInformacion, fetchDocumentosReferencia,
        syncUnidades, syncCargos, fetchCargos, fetchProcesos, fetchProcedimientos, fetchCargoProcesos, fetchOperaciones, fetchPasos, fetchAcciones, fetchFiguras,
        saveProceso, updateProceso, deleteProceso,
        saveProcedimiento, updateProcedimiento, deleteProcedimiento,
        saveCargoProceso, updateCargoProceso, deleteCargoProceso,
        saveRiesgo, updateRiesgo, deleteRiesgo,
        saveControl, updateControl, deleteControl,
        saveRequisito, updateRequisito, deleteRequisito,
        saveNormativa, updateNormativa, deleteNormativa,
        saveIndicador, updateIndicador, deleteIndicador,
        saveEquipo, updateEquipo, deleteEquipo,
        saveSistemaInformacion, updateSistemaInformacion, deleteSistemaInformacion,
        saveAccion, updateAccion, deleteAccion,
        saveFlujoCompleto,
        saveMatrixRow, fetchMatrixData, deleteMatrixRow,
        saveEntity, updateEntity, deleteEntity,
        BASE_URL_MPP, BASE_URL_FLUX, BASE_URL_ORG, BASE_URL_REC, BASE_URL_CAL, BASE_URL_MOF
    };
});
