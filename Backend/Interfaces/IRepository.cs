using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Backend.Entities;

namespace Backend.Interfaces
{
    /// <summary>
    /// Generic repository interface for managing standard CRUD operations on database entities.
    /// </summary>
    /// <typeparam name="T">An entity type that inherits from <see cref="BaseEntity"/>.</typeparam>
    public interface IRepository<T> where T : BaseEntity
    {
        /// <summary>
        /// Retrieves an entity by its unique identifier.
        /// </summary>
        /// <param name="id">The unique identifier of the entity.</param>
        /// <returns>A task that represents the asynchronous operation. The task result contains the entity if found; otherwise, null.</returns>
        Task<T?> GetByIdAsync(Guid id);

        /// <summary>
        /// Retrieves all active entities of type T.
        /// </summary>
        /// <returns>A task that represents the asynchronous operation. The task result contains a read-only list of entities.</returns>
        Task<IReadOnlyList<T>> GetAllAsync();

        /// <summary>
        /// Finds entities matching a specified filter predicate.
        /// </summary>
        /// <param name="predicate">The expression containing filter criteria.</param>
        /// <returns>A task that represents the asynchronous operation. The task result contains a read-only list of matching entities.</returns>
        Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate);

        /// <summary>
        /// Adds a new entity to the data store.
        /// </summary>
        /// <param name="entity">The entity to add.</param>
        /// <returns>A task representing the asynchronous creation operation. The task result contains the added entity.</returns>
        Task<T> AddAsync(T entity);

        /// <summary>
        /// Updates an existing entity in the data store.
        /// </summary>
        /// <param name="entity">The entity containing updated values.</param>
        /// <returns>A task representing the asynchronous update operation.</returns>
        Task UpdateAsync(T entity);

        /// <summary>
        /// Marks an entity as soft-deleted by setting the IsDeleted flag.
        /// </summary>
        /// <param name="entity">The entity to soft-delete.</param>
        /// <param name="deletedBy">The identifier of the user who deleted the entity.</param>
        /// <returns>A task representing the asynchronous delete operation.</returns>
        Task DeleteAsync(T entity, string? deletedBy = null);

        /// <summary>
        /// Permanently deletes an entity from the database.
        /// </summary>
        /// <param name="entity">The entity to hard-delete.</param>
        /// <returns>A task representing the asynchronous hard delete operation.</returns>
        Task HardDeleteAsync(T entity);

        /// <summary>
        /// Counts the total number of active entities in the database.
        /// </summary>
        /// <returns>A task representing the asynchronous counting operation.</returns>
        Task<int> CountAsync();

        /// <summary>
        /// Checks if an entity exists that matches the specified filter predicate.
        /// </summary>
        /// <param name="predicate">The condition expression to evaluate.</param>
        /// <returns>A task representing the asynchronous check operation. The task result contains true if any match exists; otherwise, false.</returns>
        Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);
    }
}
