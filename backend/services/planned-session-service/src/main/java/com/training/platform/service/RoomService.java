package com.training.platform.service;

import com.training.platform.entity.Room;
import com.training.platform.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoomService {

    @Autowired
    private RoomRepository repository;

    public List<Room> getAllRooms() {
        return repository.findAll();
    }

    public Optional<Room> getRoomById(Long id) {
        return repository.findById(id);
    }

    public Optional<Room> getRoomByName(String name) {
        return repository.findByName(name);
    }

    public Room createRoom(Room room) {
        if (repository.findByName(room.getName()).isPresent()) {
            throw new IllegalArgumentException("Room with this name already exists");
        }
        return repository.save(room);
    }

    public Room updateRoom(Long id, Room updatedRoom) {
        return repository.findById(id).map(room -> {
            room.setName(updatedRoom.getName());
            room.setCapacity(updatedRoom.getCapacity());
            room.setHasProjector(updatedRoom.isHasProjector());
            room.setHasComputers(updatedRoom.isHasComputers());
            room.setHasWhiteboard(updatedRoom.isHasWhiteboard());
            room.setAvailable(updatedRoom.isAvailable());
            return repository.save(room);
        }).orElseThrow(() -> new RuntimeException("Room not found with id " + id));
    }

    public void deleteRoom(Long id) {
        repository.deleteById(id);
    }
}
