const express = require("express");
const router = express.Router();

const Event = require("../models/event");
const EventType = require("../models/eventType");
const EventCategory = require("../models/eventCategory");
const EventCoverage = require("../models/eventCoverage");
const User = require("../models/user");
const ActiveSession = require("../models/activeSession");

const reqAuth = require("../config/safeRoutes").reqAuth;
const faker = require("faker");

// route /admin/events/
router.post("/all", reqAuth, async function (req, res) {
  try {
    const token = String(req.headers.authorization);
    const session = await ActiveSession.find({ token });
    const user_id = session[0].userId;
    const userLogged = await User.findById(user_id)
      .populate("user_type_id", "permission")
      .select("name");
    let filter = {};
    if (!userLogged) {
      return res.status(500).json({
        success: false,
        msg: "Erro ao buscar o usuário logado",
      });
    }
    if (!userLogged.user_type_id || !userLogged.user_type_id.permission) {
      return res.status(500).json({
        success: false,
        msg: "Tipo ou permissão do usuário não encontrado",
      });
    }

    let adminChanging = false;
    if (userLogged.user_type_id.permission === "1") {
      // Se usuário for "Proponente", deve mostrar apenas eventos relacionados à eles
      filter = { user_id };
    } else if (
      ["2", "3", "5"].indexOf(userLogged.user_type_id.permission) !== -1
    ) {
      // Senão, mostrar todos os eventos (do usuário & entre os status: "Revisão", "Recusado", "Aprovado", "Finalizado")
      adminChanging = true;
      filter = {
        $or: [
          { user_id },
          { status: { $in: ["revision", "refused", "approved", "finished"] } },
          // TODO: Verificar se serão esses status
        ],
      };
    }

    return Event.find(filter)
      .populate([
        {
          path: "dates",
          select: "start_date end_date",
          options: {
            sort: {
              start_date: 1,
              end_date: 1,
            },
          },
        },
        {
          path: "event_type_id",
          select: "name",
        },
        {
          path: "user_id",
          select: "name",
        },
      ])
      .exec((err, events) => {
        if (err) {
          return res.status(500).json({ success: false, msg: err });
        }
        events = events.map(function (item) {
          const ev = item.toJSON();
          ev.__v = undefined;
          ev.date = "";
          ev.disabled =
            ["created", "correct", "finished"].indexOf(ev.status) !== -1 &&
            !adminChanging;
          if (item.dates && item.dates.length) {
            if (item.dates.length === 1) {
              // Event has just one date
              const startDate = toDateFormatted(item.dates[0].start_date);
              const endDate = toDateFormatted(item.dates[0].end_date);
              if (
                endDateIsBiggerAndAnotherDayFromStartDate(startDate, endDate)
              ) {
                // If end_date is bigger then and another day of start_date
                ev.date = `${startDate} até ${endDate}`;
              } else {
                ev.date = startDate;
              }
            } else {
              // Event has more than one date
              const startDate = toDateFormatted(
                findMinStartDateOnObject(item.dates).start_date
              );
              const endDate = toDateFormatted(
                findMaxEndDateOnObject(item.dates).end_date
              );
              if (
                endDateIsBiggerAndAnotherDayFromStartDate(startDate, endDate)
              ) {
                // If end_date is bigger then and another day of start_date
                ev.date = `${startDate} até ${endDate}`;
              } else {
                ev.date = startDate;
              }
            }
          }
          ev.dates = undefined;
          return ev;
        });
        return res.json(events);
      });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

router.post("/create", async (req, res) => {
  const {
    event_type_id,
    user_id,
    name,
    category_id,
    category_second_field_value,
    coverage_id,
    coverage_second_field_value,
    workload,
    audience_estimate,
    online,
    link,
    place,
    ticket,
    objective,
    reason,
    schedule,
    details,
    resources,
    receipt_amount,
    total_amount,
    send_to_review,
  } = req.body;

  const query = {
    event_type_id,
    user_id,
    name,
    category_id,
    category_second_field_value,
    coverage_id,
    coverage_second_field_value,
    workload,
    audience_estimate,
    online,
    link,
    place,
    ticket,
    objective,
    reason,
    schedule,
    details,
    resources,
    receipt_amount,
    total_amount,
    status: send_to_review ? "revision" : "created", // Se é alteração do status, é alterado para "Em revisão"
  };

  try {
    const validation = await validateEventNameUserTypeCategoryAndCoverage({
      event_name: name,
      event_id: null,
      user_id,
      event_type_id,
      category_id,
      coverage_id,
    });

    if (!validation.success) {
      return res.status(500).json({
        success: false,
        msg:
          validation.msg ||
          "Erro ao criar o evento. Entre em contato com o administrador do sistema.",
      });
    }

    Event.create(query, function (err, event) {
      if (err) {
        const firstErrorKey = Object.keys(err.errors).shift();
        if (firstErrorKey) {
          return res.status(500).json({
            success: false,
            msg: err.errors[firstErrorKey].message,
          });
        }
        return res.status(500).json({
          success: false,
          msg: err,
        });
      }

      // TODO: Create event dates (from ID: event._id)
      // TODO: Create event lecturers (from ID: event._id)
      // TODO: Create event organizers (from ID: event._id)
      // TODO: Create event expenses (from ID: event._id)

      return res.json({
        success: true,
        eventID: event._id,
        msg: "Evento criado com sucesso",
      });
    });
    // return res.status(500).json({ success: false });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

router.post("/get/:eventID", reqAuth, async function (req, res) {
  const { eventID } = req.params;

  try {
    const token = String(req.headers.authorization);
    const session = await ActiveSession.find({ token });
    const user_id = session[0].userId;
    const userLogged = await User.findById(user_id)
      .populate("user_type_id", "permission")
      .select("name");
    if (!userLogged) {
      return res.status(500).json({
        success: false,
        msg: "Erro ao buscar o usuário logado",
      });
    }
    if (!userLogged.user_type_id || !userLogged.user_type_id.permission) {
      return res.status(500).json({
        success: false,
        msg: "Tipo ou permissão do usuário não encontrado",
      });
    }

    return Event.findOne({ _id: eventID })
      .populate([
        { path: "user_id", select: "name" },
        { path: "dates", select: "start_date end_date" },
        {
          path: "lecturers",
          select: "lecturer_id type",
          populate: { path: "lecturer_id", select: "name office lattes" },
        },
        {
          path: "organizers",
          select: "organizer_id office workload",
          populate: { path: "organizer_id", select: "name identification" },
        },
        {
          path: "expenses",
          select: "expense_id provider amount file comments",
          populate: { path: "event_expense_type_id" },
        },
      ])
      .then(async (event) => {
        if (!event) {
          return res
            .status(500)
            .json({ success: false, msg: "Evento não encontrado" });
        }
        // Usuário é "Proponente" e o evento não está disponível para ele consultar
        if (
          userLogged.user_type_id.permission === "1" &&
          ["created", "correct", "finished"].indexOf(event.status) === -1
        ) {
          return res.status(500).json({
            success: false,
            msg: "Você não tem permissão para acessar esse evento",
          });
        }

        if (
          event.user_id &&
          event.user_id._id &&
          event.user_id._id.toString() === user_id
        ) {
          if (event.dates && event.dates.length) {
            event.dates = event.dates.map(function (date) {
              const dt = date.toJSON();
              dt.date = toDateFormatted(date.start_date, true);
              dt.start_time = transformDateToTime(date.start_date);
              dt.end_time = transformDateToTime(date.end_date);
              dt.start_date = undefined;
              dt.end_date = undefined;
              return dt;
            });
          }
          if (event.lecturers && event.lecturers.length) {
            event.lecturers = event.lecturers.map(function (lecturer) {
              const lect = lecturer.toJSON();
              lect.name = lecturer.lecturer_id.name;
              lect.office = lecturer.lecturer_id.office;
              lect.lattes = lecturer.lecturer_id.lattes;
              lect.guest = lecturer.type === "guest";
              lect.type = undefined;
              lect.lecturer_id = undefined;
              lect.event_id = undefined;
              return lect;
            });
          }
          if (event.organizers && event.organizers.length) {
            event.organizers = event.organizers.map(function (organizer) {
              const org = organizer.toJSON();
              org.name = organizer.organizer_id.name;
              org.identification = organizer.organizer_id.identification;
              org.organizer_id = undefined;
              org.event_id = undefined;
              return org;
            });
          }
          if (event.expenses && event.expenses.length) {
            event.expenses = event.expenses.map(function (expense) {
              const exp = expense.toJSON();
              exp.amount = exp.amount.toFixed(2);
              exp.event_id = undefined;
              return exp;
            });
          }
          return res.json(event);
        }
        return res.status(500).json({
          success: false,
          msg: "Você não tem permissão para acessar esse evento",
        });
      });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

router.post("/edit/:eventID", reqAuth, function (req, res) {
  const { eventID } = req.params;

  const {
    event_type_id,
    name,
    category_id,
    category_second_field_value,
    coverage_id,
    coverage_second_field_value,
    workload,
    audience_estimate,
    online,
    link,
    place,
    ticket,
    objective,
    reason,
    schedule,
    details,
    resources,
    receipt_amount,
    total_amount,
    send_to_review,
  } = req.body;

  try {
    Event.findById(eventID).then(async (event) => {
      if (!event) {
        return res
          .status(500)
          .json({ success: false, msg: "Evento não encontrado" });
      }
      const token = String(req.headers.authorization);
      const session = await ActiveSession.find({ token: token });
      const user_id = session[0].userId;
      const userLogged = await User.findById(user_id)
        .populate("user_type_id", "permission")
        .select("name");
      if (!userLogged) {
        return res.status(500).json({
          success: false,
          msg: "Erro ao buscar o usuário logado",
        });
      }
      if (!userLogged.user_type_id || !userLogged.user_type_id.permission) {
        return res.status(500).json({
          success: false,
          msg: "Tipo ou permissão do usuário não encontrado",
        });
      }
      // Usuário é "Proponente" e o evento não está disponível para ele alterar
      if (
        userLogged.user_type_id.permission === "1" &&
        ["created", "correct", "finished"].indexOf(event.status) === -1
      ) {
        return res.status(500).json({
          success: false,
          msg: "Você não tem permissão para alterar esse evento",
        });
      }

      const validation = await validateEventNameUserTypeCategoryAndCoverage({
        event_name: name,
        event_id: eventID,
        user_id,
        event_type_id,
        category_id,
        coverage_id,
      });

      if (!validation.success) {
        return res.status(500).json({
          success: false,
          msg:
            validation.msg ||
            "Erro ao criar o evento. Entre em contato com o administrador do sistema.",
        });
      }

      let adminChanging = false;
      if (
        event.user_id !== user_id &&
        ["2", "3", "5"].indexOf(userLogged.user_type_id.permission) !== -1
      ) {
        // Verifica se o usuário que está alterando é o mesmo que criou o evento & o usuário que está alterando tem permissão de admin ("2", "3", "5")
        adminChanging = true;
      }
      const oldStatus = event.status;
      const newStatus = send_to_review // Se é alteração do status
        ? ["created", "correct"].indexOf(oldStatus) !== -1 // Se o status antigo é "Criado"/"Corrigir", é alterado para "Em revisão"
          ? "revision"
          : oldStatus === "revision" && adminChanging // Se o status antigo é "Em revisão" e o usuário que está alterando é um admin ("2", "3", "5"), é alterado para "Corrigir"
          ? "correct"
          : oldStatus
        : oldStatus;

      // TODO: Detectar alteração de status "Reprovado", "Aprovado" e "Finalizado"

      const query = { _id: event._id };
      const newvalues = {
        $set: {
          event_type_id,
          name,
          category_id,
          category_second_field_value,
          coverage_id,
          coverage_second_field_value,
          workload,
          audience_estimate,
          online,
          link,
          place,
          ticket,
          objective,
          reason,
          schedule,
          details,
          resources,
          receipt_amount,
          total_amount,
          status: newStatus,
        },
      };
      Event.updateOne(query, newvalues, function (err, cb) {
        if (err) {
          return res.status(500).json({
            success: false,
            msg: "Ocorreu um erro. Favor contatar o administrador",
          });
        }
        // TODO: Update event dates
        // TODO: Update event lecturers
        // TODO: Update event organizers
        // TODO: Update event expenses
        return res.json({ success: true });
      });
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

router.delete("/:eventID", reqAuth, function (req, res) {
  const { eventID } = req.params;

  try {
    Event.findById({ _id: eventID }).then(async (event) => {
      if (event) {
        const token = String(req.headers.authorization);
        const session = await ActiveSession.find({ token: token });
        const user_id = session[0].userId;
        const userLogged = await User.findById(user_id)
          .populate("user_type_id", "permission")
          .select("name");
        if (!userLogged) {
          return res.status(500).json({
            success: false,
            msg: "Erro ao buscar o usuário logado",
          });
        }
        if (!userLogged.user_type_id || !userLogged.user_type_id.permission) {
          return res.status(500).json({
            success: false,
            msg: "Tipo ou permissão do usuário não encontrado",
          });
        }
        // Usuário é "Proponente" e o evento não está disponível para ele deletar
        if (
          userLogged.user_type_id.permission === "1" &&
          ["created", "correct", "finished"].indexOf(event.status) === -1
        ) {
          return res.status(500).json({
            success: false,
            msg: "Você não tem permissão para deletar esse evento",
          });
        }
        return event
          .deleteOne()
          .then(() => {
            return res.json({ success: true });
          })
          .catch(() => {
            return res
              .status(500)
              .json({ success: false, msg: "Erro ao deletar o evento" });
          });
      }
      return res
        .status(500)
        .json({ success: false, msg: "Evento não encontrado" });
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

module.exports = router;

function toDateFormatted(dateToFormat, ymdFormat = false) {
  const date = new Date(dateToFormat).toISOString().replace(/T(\S+)$/, ""); // Replacing the 'T00:00:00.000Z' part of the date
  const dateSplitted = date.split("-");
  if (ymdFormat) {
    return date;
  }
  return `${dateSplitted[2]}/${dateSplitted[1]}/${dateSplitted[0]}`;
}

function transformDateToTime(dateToTransform) {
  const date = new Date(dateToTransform);
  const hours =
    date.getUTCHours() < 10 ? `0${date.getUTCHours()}` : date.getUTCHours();
  const minutes =
    date.getUTCMinutes() < 10
      ? `0${date.getUTCMinutes()}`
      : date.getUTCMinutes();
  return `${hours}:${minutes}`;
}

function findMinStartDateOnObject(object) {
  return object.reduce(function (a, b) {
    return new Date(a.start_date).getTime() < new Date(b.start_date).getTime()
      ? a
      : b;
  });
}

function findMaxEndDateOnObject(object) {
  return object.reduce(function (a, b) {
    return new Date(a.end_date).getTime() > new Date(b.end_date).getTime()
      ? a
      : b;
  });
}

function endDateIsBiggerAndAnotherDayFromStartDate(startDate, endDate) {
  return (
    new Date(endDate).getTime() > new Date(startDate).getTime() &&
    new Date(endDate).getDay() !== new Date(startDate).getDay()
  );
}

async function validateEventNameUserTypeCategoryAndCoverage({
  event_name,
  event_id,
  user_id,
  event_type_id,
  category_id,
  coverage_id,
}) {
  const eventAlreadyExists = await Event.findOne({ name: event_name });
  if (
    eventAlreadyExists &&
    eventAlreadyExists._id.toString() !== event_id.toString()
  ) {
    return {
      success: false,
      msg: "Evento já existente. Tente informar outro nome.",
    };
  }
  const userExists = await User.findById(user_id);
  if (!userExists) {
    return {
      success: false,
      msg: "Usuário não encontrado",
    };
  }
  const eventTypeExists = await EventType.findById(event_type_id);
  if (!eventTypeExists) {
    return {
      success: false,
      msg: "Tipo do evento não encontrado",
    };
  }
  const eventCategoryExists = await EventCategory.findById(category_id);
  if (!eventCategoryExists) {
    return {
      success: false,
      msg: "Categoria (modalidade) do evento não encontrada",
    };
  }
  const eventCoverageExists = await EventCoverage.findById(coverage_id);
  if (!eventCoverageExists) {
    return {
      success: false,
      msg: "Abrangência do evento não encontrada",
    };
  }
  return {
    success: true,
  };
}
