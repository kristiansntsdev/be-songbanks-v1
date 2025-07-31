import { BaseModel, ModelFactory } from "../../package/src/engine/index.js";
import sequelize from "../../config/database.js";

class User extends BaseModel {
  static get casts() {
    return {
      role: "string",
      status: "string",
      userType: "string",
    };
  }

  static get scopes() {
    return {
      withPassword: {
        attributes: { exclude: [] },
      },
      pengurus: {
        where: { userType: "pengurus" },
      },
      peserta: {
        where: { userType: "peserta" },
      },
    };
  }

  static associate(models) {
    this.hasMany(models.Note, {
      foreignKey: "user_id",
      as: "notes",
    });
  }

  static async findByCredentials(username, password) {
    const pengurusUser = await sequelize.query(
      'SELECT *, "pengurus" as userType FROM pengurus WHERE username = ? AND password = ?',
      {
        replacements: [username, password],
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );

    if (pengurusUser.length > 0) {
      const user = pengurusUser[0];
      return {
        id: user.id_pengurus,
        nama: user.nama,
        username: user.username,
        userType: "pengurus",
        isAdmin: true,
        leveladmin: user.leveladmin,
        nowa: user.nowa,
        kotalevelup: user.kotalevelup,
      };
    }

    const pesertaUser = await sequelize.query(
      'SELECT *, "peserta" as userType FROM peserta WHERE email = ? AND password = ?',
      {
        replacements: [username, password],
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );

    if (pesertaUser.length > 0) {
      const user = pesertaUser[0];
      return {
        id: user.id_peserta,
        nama: user.nama,
        username: user.email,
        userCode: user.usercode,
        userType: "peserta",
        isAdmin: false,
        gender: user.gender,
        pendidikan: user.pendidikan,
        pekerjaan: user.pekerjaan,
        provinsi: user.provinsi,
        kabupaten: user.kabupaten,
        kecamatan: user.kecamatan,
        desa: user.desa,
        alamat: user.alamat,
        tgllahir: user.tgllahir,
        tempatlahir: user.tempatlahir,
        nowa: user.nowa,
        kotalevelup: user.kotalevelup,
        gereja: user.gereja,
        email: user.email,
        userlevel: user.userlevel,
        verifikasi: user.verifikasi,
        foto: user.foto,
        status: user.status,
        role: user.role,
      };
    }

    return null;
  }

  static async findById(id, userType) {
    if (userType === "pengurus") {
      const result = await sequelize.query(
        'SELECT *, "pengurus" as userType FROM pengurus WHERE id_pengurus = ?',
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );

      if (result.length > 0) {
        const user = result[0];
        return {
          id: user.id_pengurus,
          nama: user.nama,
          username: user.username,
          userType: "pengurus",
          isAdmin: true,
          leveladmin: user.leveladmin,
          nowa: user.nowa,
          kotalevelup: user.kotalevelup,
        };
      }
    } else if (userType === "peserta") {
      const result = await sequelize.query(
        'SELECT *, "peserta" as userType FROM peserta WHERE id_peserta = ?',
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );

      if (result.length > 0) {
        const user = result[0];
        return {
          id: user.id_peserta,
          nama: user.nama,
          username: user.email,
          userCode: user.usercode,
          userType: "peserta",
          isAdmin: false,
          gender: user.gender,
          pendidikan: user.pendidikan,
          pekerjaan: user.pekerjaan,
          provinsi: user.provinsi,
          kabupaten: user.kabupaten,
          kecamatan: user.kecamatan,
          desa: user.desa,
          alamat: user.alamat,
          tgllahir: user.tgllahir,
          tempatlahir: user.tempatlahir,
          nowa: user.nowa,
          kotalevelup: user.kotalevelup,
          gereja: user.gereja,
          email: user.email,
          userlevel: user.userlevel,
          verifikasi: user.verifikasi,
          foto: user.foto,
          status: user.status,
          role: user.role,
        };
      }
    }

    return null;
  }

  isAdmin() {
    return this.userType === "pengurus";
  }

  isPeserta() {
    return this.userType === "peserta";
  }

  static async findByEmail(email) {
    const result = await sequelize.query(
      'SELECT *, "peserta" as userType FROM peserta WHERE email = ?',
      {
        replacements: [email],
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );

    if (result.length > 0) {
      const user = result[0];
      return {
        id: user.id_peserta,
        nama: user.nama,
        username: user.email,
        userCode: user.usercode,
        userType: "peserta",
        isAdmin: false,
        email: user.email,
        userlevel: user.userlevel,
        verifikasi: user.verifikasi,
        status: user.status,
        role: user.role,
      };
    }

    return null;
  }
}

export default ModelFactory.register(User, sequelize, {
  tableName: "users",
});
