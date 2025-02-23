import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createReserva } from './redux/slice';
import "./../App.css";

const NuevaReserva = ({ prestador }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.reservas.user); // Obtener datos del usuario desde el estado

  // Inicializar formData con los datos del usuario si está logeado
  const initialFormData = {
    nombreCliente: user ? user.username : '',
    email: user ? user.email : '',
    fecha: '',
    hora: '',
    prestador: prestador ? prestador.id : '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [messages, setMessages] = useState({ success: '', error: '' });
  const reservas = useSelector((state) => state.reservas.reservas.data);
  const prestadores = useSelector((state) => state.reservas.prestadores);
  const maxReservasPorDia = useSelector((state) => state.reservas.maxReservasPorDia);
  const maxReservasPorHora = useSelector((state) => state.reservas.maxReservasPorHora);

  const [availableDates, setAvailableDates] = useState([]);
  const [availableHours, setAvailableHours] = useState([]);

  useEffect(() => {
    updateAvailableDates();
  }, [formData.prestador, reservas]);

  useEffect(() => {
    updateAvailableHours();
  }, [formData.fecha, formData.prestador, reservas]);

  const updateAvailableDates = () => {
    if (!formData.prestador) return;

    const today = new Date();
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0) { // Excluye los domingos
        const dateString = date.toISOString().split('T')[0];
        if (!isDayFull(dateString)) {
          dates.push(dateString);
        }
      }
    }
    setAvailableDates(dates);
  };

  const updateAvailableHours = () => {
    if (!formData.prestador || !formData.fecha) return;

    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    const availableHours = hours.filter(hour => !isHourReserved(formData.fecha, `${hour}:00.000`));
    setAvailableHours(availableHours);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'prestador' || name === 'fecha') {
      setFormData(prev => ({ ...prev, hora: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isHourReserved(formData.fecha, `${formData.hora}:00.000`)) {
      setMessages({ success: '', error: 'Este horario ya está reservado. Por favor, elige otro.' });
      return;
    }
    try {
      const horaFormateada = `${formData.hora}:00.000`;
      await dispatch(createReserva({ ...formData, hora: horaFormateada }));
      setMessages({ success: '¡Reserva realizada con Éxito!', error: '' });
    } catch (error) {
      setMessages({ success: '', error: error.message || 'Error al realizar la reserva.' });
    }
  };

  const telefonoPrestador = '542915729501';
  const handleWhatsApp = () => {
    const prestadorSeleccionado = prestadores.find(p => p.id === formData.prestador);
    const nombrePrestador = prestadorSeleccionado?.attributes?.nombre || '';
    const message = `¡Hola! Quiero confirmar mi reserva:\n\nNombre: ${formData.nombreCliente}\nEmail: ${formData.email}\nFecha: ${formData.fecha}\nHora: ${formData.hora}\nPrestador: ${nombrePrestador}`;
    const whatsappURL = `https://wa.me/${telefonoPrestador}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
  };

  const isDayFull = (date) => {
    const reservasDelDia = reservas?.filter(reserva =>
      reserva.attributes.fecha === date &&
      reserva.attributes.prestador.data.id === formData.prestador
    );
    return reservasDelDia?.length >= maxReservasPorDia;
  };

  const isHourReserved = (date, hour) => {
    return reservas?.some(reserva =>
      reserva.attributes.fecha === date &&
      reserva.attributes.hora === hour &&
      reserva.attributes.prestador.data.id === formData.prestador
    );
  };

  // Si el usuario ya está logeado, no solicitar nombre ni email
  if (user) {
    return (
      <div className="nueva-reserva-container" style={{ marginBottom: "2rem" }}>
        <h1>Reserva de Turnos</h1>
        <p>Campos obligatorios <span style={{ color: "red" }}>*</span></p>
        <form className="nueva-reserva-form" onSubmit={handleSubmit}>
          <div>
            <label>Turno con :</label>
            <select name="prestador" value={formData.prestador} onChange={handleChange} required>
              <option value="">Selecciona un prestador</option>
              {prestador
                ? <option value={prestador.id}>{prestador.nombrePrestador}</option>
                : prestadores.map(e => <option key={e.id} value={e.id}>{e?.attributes?.nombre}</option>)
              }
            </select>
          </div>
          <div>
            <label>Fecha</label>
            <select
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              required
              disabled={!formData.prestador}
            >
              <option value="">Selecciona una fecha</option>
              {availableDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Hora</label>
            <select
              name="hora"
              value={formData.hora}
              onChange={handleChange}
              required
              disabled={!formData.fecha}
            >
              <option value="">Selecciona una hora</option>
              {availableHours.map(hour => (
                <option key={hour} value={hour}>{hour}</option>
              ))}
            </select>
          </div>
          {messages.error && <p className="error-message">{messages.error}</p>}
          {messages.success && <p className="success-message">{messages.success}</p>}
          <button type="submit" disabled={!formData.fecha || !formData.hora || messages.success}>Reservar</button>
        </form>
        {messages.success && (
          <button onClick={handleWhatsApp} style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#25D366", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", width:"100%" }}>
            Enviar Confirmación por WhatsApp
          </button>
        )}
      </div>
    );
  }

  // Si el usuario no está logeado, mostrar formulario completo
  return (
    <div className="nueva-reserva-container" style={{ marginBottom: "2rem" }}>
      <h1>Reserva de Turnos</h1>
      <p>Campos obligatorios <span style={{ color: "red" }}>*</span></p>
      <form className="nueva-reserva-form" onSubmit={handleSubmit}>
        <div>
          <label>Turno con :</label>
          <select name="prestador" value={formData.prestador} onChange={handleChange} required>
            <option value="">Selecciona un prestador</option>
            {prestador
              ? <option value={prestador.id}>{prestador.nombrePrestador}</option>
              : prestadores.map(e => <option key={e.id} value={e.id}>{e?.attributes?.nombre}</option>)
            }
          </select>
        </div>
        <div>
          <label>Nombre</label>
          <input type="text" name="nombreCliente" value={formData.nombreCliente} onChange={handleChange} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <label>Fecha</label>
          <select
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
            disabled={!formData.prestador}
          >
            <option value="">Selecciona una fecha</option>
            {availableDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Hora</label>
          <select
            name="hora"
            value={formData.hora}
            onChange={handleChange}
            required
            disabled={!formData.fecha}
          >
            <option value="">Selecciona una hora</option>
            {availableHours.map(hour => (
              <option key={hour} value={hour}>{hour}</option>
            ))}
          </select>
        </div>
        {messages.error && <p className="error-message">{messages.error}</p>}
        {messages.success && <p className="success-message">{messages.success}</p>}
        <button type="submit" disabled={!formData.fecha || !formData.hora || messages.success}>Reservar</button>
      </form>
      {messages.success && (
        <button onClick={handleWhatsApp} style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#25D366", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", width:"100%" }}>
          Enviar Confirmación por WhatsApp
        </button>
      )}
    </div>
  );
};

export default NuevaReserva;
